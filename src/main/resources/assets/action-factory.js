function ActionFactory() {
	
	this.error = (message) => {
		return {
			type : 'ERROR',
			message : message
		}
	}
	
	this.init = (id, password, status, action) => {
		return {
	        type: 'INIT',
	        id: id,
	        password, password,
	        status: status,
	        action: action
	    }
	}
	
	this.downloaded = (data) => {
		return {
	        type: 'DOWNLOADED',
	        data: data
	    }
	}
		
	this.authorized = (password) => {
		return {
	        type: 'AUTHORIZED',
	        password, password
	    }
	}
	
	this.unauthorized = () => {
		return {
	        type: 'AUTHORIZATION_FAILED'
	    }
	}
	
	this.clear = () => {
		return {
	        type: 'CLEAR'
	    }
	}
	
	this.setPackageDescription = (description) => {
		return {
	        type: 'SET_PACKAGE_DESCRIPTION',
	        description: description
	    }
	}
	
	this.setPackageStatus = (status) => {
		return {
	        type: 'SET_PACKAGE_STATUS',
	        status: status
	    }
	}
	
	this.setPackageProgress = (status, progress) => {
		return {
	        type: 'SET_PACKAGE_PROGRESS',
	        status: status,
	        progress: progress
	    }
	}
	
	this.requestScan = () => {
		return {
	        type: 'REQUEST_SCAN'
	    }
	}
	
	this.addFile = (file) => {
		return {
	        type: 'ADD_FILE',
	        file: file
	    }
	}
	
	this.removeFile = (fileName) => {
		return {
	        type: 'REMOVE_FILE',
	        fileName: fileName
	    }
	}
	
	this.setFileDescription = (fileName, description) => {
		return {
	        type: 'SET_FILE_DESCRIPTION',
	        fileName: fileName,
	        description: description
	    }
	}
	
	this.setFileToSign = (fileName, toSign) => {
		return {
	        type: 'SET_FILE_TO_SIGN',
	        fileName: fileName,
	        toSign: toSign
	    }
	}
	
	this.setFileProgress = (fileName, status, progress) => {
		return {
	        type: 'SET_FILE_PROGRESS',
	        fileName: fileName,
	        status: status,
	        progress: progress
	    }
	}
	
	this.setFileEncryptedContent = (fileName, encryptedFile) => {
		return {
	        type: 'SET_FILE_ENCRYPTED_CONTENT',
	        fileName: fileName,
	        encryptedFile: encryptedFile
	    }
	}	
}