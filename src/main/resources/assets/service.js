function EswService(baseUrl) {
	this.baseUrl = baseUrl;
	
	this.uploadUrl = baseUrl + '/api/file/upload'
	this.downloadUrl = baseUrl + '/api/file/download'
	
	this.fileSystem = null;
	
	this.createSecrets = function() {
		const password = randomString(30);
    	const id = Sha256.hash(Sha256.hash(password));
    	return {id: id, password: password};
	}
	
	this.createId = function(password) {
		return Sha256.hash(Sha256.hash(password));
	} 
	
	this.authenticate = function(id, password) {
		return id == this.createId(password);
	}
	
	this.readFile = function(file, handleBytes, handleError, handleProgress) {
		var reader = new FileReader();
		reader.onload = function(e) {
			handleBytes(reader.result);
		};
		reader.onerror = function(e) {
			handleError(e.message);
		};
		reader.onprogress = function(e) {
			handleProgress(e.lengthComputable, e.loaded, e.total);
		};
		reader.readAsArrayBuffer(file);
	};

	this.encryptBytes = function(bytes, password, handleEncrypted, handleError,
			handleProgress) {
		var cypherTxt = '';
		var progress = 0;
		var worker = new Worker('aes_ctr.js');
		var contentBytes = new Uint8Array(bytes);
		worker.addEventListener("error", function(e) {
			handleError(e.message);
		});
		worker.addEventListener("message", function(objEvent) {
			var count = objEvent.data.count;
			var total = objEvent.data.total;
			var cypherBlock = objEvent.data.cypherBlock;

			if (count == 0 && total == 0) {
				// we recieved first chunk from AES which includes first 8 chars
				// of IV vector to be added to to start of file
				cypherTxt = '';
			} else if (count == -1 && total == -1) {
				// we already recieved everything so just finalize...
				handleEncrypted(window.btoa(cypherTxt));
				return;
			}

			// convert received byte array to string
			for (var i = 0; i < cypherBlock.length; i++) {
				cypherTxt += String.fromCharCode(cypherBlock[i]);
			}

			if (total != 0) {
				actualProgress = count / total;
				// report 5% steps only
				if (actualProgress - progress > 0.05) {
					handleProgress(true, count, total);
					progress = actualProgress;
				}
			}

		}, false);
		var randomIV = new Uint32Array(16);
		window.crypto.getRandomValues(randomIV);
		// convert to just 8 bytes (not 32 bit words)
		var ivBytes = new Uint8Array(randomIV.buffer, 0, 8); 
		var objData = {
			pwd : password,
			iv : ivBytes,
			plainText : contentBytes
		};
		worker.postMessage(objData, [ objData.plainText.buffer ])
	};
	
	this.decryptBytes = function(bytes, password, handleDecrypted, handleError,
			handleProgress) {
		// just a simulation
		setTimeout(function(){
			handleProgress(true, 1, 1);
			handleDecrypted(bytes);
		}, 1000);
	}

	this.writeFile = function(name, bytes, contentType, handleFile,
			handleError, handleProgress) {
		this.fileSystem.root.getFile(name, {
			create : true
		}, function(fileEntry) {
			fileEntry.createWriter(function(fileWriter) {
				fileWriter.onwriteend = function(e) {
					handleFile(fileEntry);
				};
				fileWriter.onerror = function(e) {
					handleError(error.message);
				};
				fileWriter.onprogress = function(e) {
					handleProgress(e.lengthComputable, e.loaded, e.total);
				};
				var blob = new Blob([ bytes ], {
					type : contentType
				});
				fileWriter.write(blob);
			}, function(error) {
				handleError(error.message);
			});
		}, function(error) {
			handleError(error.message);
		});
	};

	this.upload = function(data, status, handleSuccess, handleError,
			handleProgress) {
		var serviceThis = this;
		var formData = new FormData();

		var metadata = {
			info : {
				id: data.info.id,
				wf_status: status,
				description: data.info.description,
			}, files : []
		};		
		// map file properties
		for (var i = 0; i < data.files.length; i++) {
			var file = data.files[i];
			metadata.files.push({
				name : file.name,
				description : file.description,
				type : file.type,
				toSign : file.toSign
			});			
		}
		formData.append('metadata', JSON.stringify(metadata));

		var contentFiles = data.files.filter(function(file) {
			return file.content ? file : null;
		});
		
		if (contentFiles.length < 1) {
			serviceThis.send('POST', serviceThis.uploadUrl, formData,
					function(response) {
						var data = JSON.parse(response);
						handleSuccess(data);
					}, handleError, handleProgress);
		}
		
		var index = 0;
		for (var j = 0; j < contentFiles.length; j++) {
			contentFiles[j].content.file(function(fileContent) {
				formData.append('file', fileContent, contentFiles[index].name);
				index++;
				if (index == contentFiles.length) {
					serviceThis.send('POST', serviceThis.uploadUrl, formData,
							function(response) {
								var data = JSON.parse(response);
								handleSuccess(data);
							}, handleError, handleProgress);
				}
			}, handleError);
		}
	};
	
	this.downloadPackage = function(packageId, handleSuccess, handleError, handleProgress) {
		this.send('GET', this.downloadUrl + '/' + packageId, '', function(response) {
			var data = JSON.parse(response);
			handleSuccess(data);
		}, handleError, handleProgress);
	};
	
	this.downloadFile = function(packageId, fileName, handleSuccess, handleError, handleProgress) {
		var root = this;
		this.send('GET', this.downloadUrl + '/' + packageId + '/' + fileName, '', handleSuccess, handleError, handleProgress);
	};

	this.send = function(method, path, data, handleSuccess, handleError,
			handleProgress) {
		var xhr = new XMLHttpRequest();
		xhr.open(method, path, true);
		xhr.onload = function(e) {
			handleSuccess(this.response);
		};
		xhr.onprogress = function(e) {
			handleProgress(e.lengthComputable, e.loaded, e.total);
		};
		xhr.onerror = function(error) {
			handleError(error.message);
		};
		xhr.send(data);
	};

	this.isReady = function() {
		return true && this.fileSystem != null;
	};

	this.initFileSystem = function() {
		var serviceThis = this;
		window.requestFileSystem = window.requestFileSystem
				|| window.webkitRequestFileSystem;
		if (window.requestFileSystem) {
			window.requestFileSystem(window.TEMPORARY, 1024 * 1024 * 100,
					function(fileSystem) {
						serviceThis.fileSystem = fileSystem;
						console.log('File system initialized.');
					}, function(error) {
						console.log('Error initializing file system: '
								+ error.message);
					});
		} else {
			console.log('Error initializing file system: Incompatible browser');
		}
	};

	this.init = function() {
		console.log('Initializing service...');
		this.initFileSystem();
	};

	this.init();
}

// importatnt hack to use babel module exports/imports
var exports = {};
function require(name) {
	return exports;
}