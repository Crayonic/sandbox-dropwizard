function Dispatcher(store, service, actionFactory) {
	this.store = store;
	this.service = service;
	this.actionFactory = actionFactory;

	this.getState = this.store.getState;
	this.dispatch = this.store.dispatch;

	this.init = function(id, action, password) {
		if (action == null || action == 'CREATE') {
			var secret = this.service.createSecrets();
			this.dispatch(this.actionFactory.init(secret.id, secret.password,
					'AUTHORIZED', 'CREATE'));
		} else {
			this.dispatch(this.actionFactory.init(id, password,
					password == null ? 'TO_AUTHORIZE' : 'AUTHORIZED', action));
			if (password != null) {
				this.downloadPackage();
			}
		}
	}

	this.initFromLocation = function() {
		var id = this.getParameterByName('id', window.location.href);
		var action = this.getParameterByName('action', window.location.href);
		this.init(id, action, null);
	}

	this.setPassword = function(password) {
		if (this.getState().info.id == null) {
			this.getState().info.id = this.service.createId(password);
			this.dispatch(this.actionFactory.authorized(password));
			this.downloadPackage();
		} else if (this.service.authenticate(this.getState().info.id, password)) {
			this.dispatch(this.actionFactory.authorized(password));
			this.downloadPackage();
		} else {
			this.dispatch(this.actionFactory.unauthorized());
		}
	}

	this.clear = function() {
		this.dispatch(this.actionFactory.clear());
	}

	this.setPackageDescription = function(description) {
		this.dispatch(this.actionFactory.setPackageDescription(description));
	}

	this.requestScan = function() {
		this.dispatch(this.actionFactory.requestScan());
	}

	this.addFiles = function(files) {
		for (var i = 0; i < files.length; i++) {
			this.addFile(files[i]);
		}
	}

	this.addFile = function(file) {
		this.dispatch(this.actionFactory.addFile(file));
		this.encryptFile(file.name, file);
	}

	this.removeFile = function(fileName) {
		this.dispatch(this.actionFactory.removeFile(fileName));
	}

	this.setFileToSign = function(fileName, toSign) {
		this.dispatch(this.actionFactory.setFileToSign(fileName, toSign));
	}

	this.setFileDescription = function(fileName, description) {
		this.dispatch(this.actionFactory.setFileDescription(fileName,
				description));
	}

	this.encryptFile = function(fileName, file) {
		var root = this;
		root._readFile(fileName, file, function(bytes) {
			root.encryptFileBytes(fileName, bytes);
		});
	}
	
	this.encryptFileBytes = function(fileName, bytes) {
		var root = this;
		root._encryptFileBytes(fileName, bytes, function(encryptedBytes) {
			root._writeFileBytes(fileName, encryptedBytes, function(
					encryptedFile) {
				root.dispatch(root.actionFactory.setFileEncryptedContent(
						fileName, encryptedFile));
			});
		});
	}

	this._readFile = function(fileName, file, handleBytes) {
		var root = this;
		root.dispatch(root.actionFactory
				.setFileProgress(fileName, 'READING', 0));
		root.service.readFile(file, function(bytes) {
			handleBytes(bytes);
		}, function(errorMessage) {
			root.error('Error reading file' + fileName + ': ' + errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'READING', loaded / total));
			}
		});
	}

	this._encryptFileBytes = function(fileName, bytes, handleBytes) {
		var root = this;
		root.dispatch(root.actionFactory.setFileProgress(fileName,
				'ENCRYPTING', 0));
		root.service.encryptBytes(bytes, root.getState().password, function(
				encryptedBytes) {
			handleBytes(encryptedBytes);
		}, function(errorMessage) {
			root
					.error('Error encrypting file' + fileName + ': '
							+ errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'ENCRYPTING', loaded / total));
			}
		});
	}

	this._writeFileBytes = function(fileName, bytes, handleFile) {
		var root = this;
		root.dispatch(root.actionFactory
				.setFileProgress(fileName, 'WRITING', 0));
		root.service.writeFile(fileName, bytes, 'text/plain', function(
				writtenFile) {
			handleFile(writtenFile);
		}, function(errorMessage) {
			root.error('Error writing file' + fileName + ': ' + errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'WRITING', loaded / total));
			}
		});
	}

	this.upload = function(action) {
		var root = this;
		var status = action == 'VIEW' ? 'REQUESTED' : 'RESPONDED';
		root.dispatch(root.actionFactory.setPackageProgress('UPLOADING', 0));
		root.service.upload(root.getState(), status, function(response) {
			root.dispatch(root.actionFactory.init(root.getState().info.id, root
					.getState().password, 'AUTHORIZED', action));
			root.downloadPackage();
			if (action == 'VIEW') {
				window.history.pushState('', '', '/index.html?action=VIEW&id='
						+ store.getState().info.id);
			}
		}, function(errorMessage) {
			root.error('Error uploading package: ' + errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setPackageProgress(
						'UPLOADING', loaded / total));
			}
		});
	}

	this.downloadPackage = function() {
		var root = this;
		root.dispatch(root.actionFactory.setPackageProgress('DOWNLOADING', 0));
		root.service.downloadPackage(root.getState().info.id,
				function(response) {
					if (response.status == 'error') {
						root.error('Error downloading package: '
								+ response.message);
					} else {
						root.dispatch(root.actionFactory.downloaded(response));
					}
				}, function(errorMessage) {
					root.error('Error downloading package: ' + errorMessage);
				}, function(lengthComputable, loaded, total) {
					if (lengthComputable) {
						root.dispatch(root.actionFactory.setPackageProgress(
								'DOWNLOADING', loaded / total));
					}
				});
	}

	this.saveFile = function(fileName) {
		var root = this;
		root._downloadFile(fileName, function(content) {
			// content to bytes
			var bytes = content;
			root._decryptFileBytes(fileName, bytes, function(decryptedBytes) {
				// bytes to content
				var decryptedContent = decryptedBytes;
				var blob = new Blob([ decryptedContent ],
						{/* type: "text/plain;charset=utf-8" */});
				saveAs(blob, fileName);
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'SAVED', 1));
			});
		});
	}

	this._downloadFile = function(fileName, handleFile) {
		var root = this;
		root.dispatch(root.actionFactory.setFileProgress(fileName,
				'DOWNLOADING', 0));
		root.service.downloadFile(root.getState().info.id, fileName, function(
				response) {
			handleFile(response);
		}, function(errorMessage) {
			root.error('Error downloading file: ' + errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'DOWNLOADING', loaded / total));
			}
		});
	}

	this._decryptFileBytes = function(fileName, bytes, handleBytes) {
		var root = this;
		root.dispatch(root.actionFactory.setFileProgress(fileName,
				'DECRYPTING', 0));
		root.service.decryptBytes(bytes, root.getState().password, function(
				decryptedBytes) {
			handleBytes(decryptedBytes);
		}, function(errorMessage) {
			root
					.error('Error decrypting file' + fileName + ': '
							+ errorMessage);
		}, function(lengthComputable, loaded, total) {
			if (lengthComputable) {
				root.dispatch(root.actionFactory.setFileProgress(fileName,
						'DECRYPTING', loaded / total));
			}
		});
	}

	this.error = function(message) {
		this.dispatch(this.actionFactory.error(message));
	}

	this.getParameterByName = function(name, url) {
		if (!url)
			url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"), results = regex
				.exec(url);
		if (!results)
			return null;
		if (!results[2])
			return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}
}