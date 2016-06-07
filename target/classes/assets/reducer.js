const initialState = { status: 'NONE', files: [] };

const findFileIndex = (fileName, files) => {
	for (var i = 0; i < files.length; i++) {
		if (fileName == files[i].name) {
			return i;
		}
	}
	return -1;
}

const updateFile = (state, fileName, data) => {
	var files = state.files;
	var index = findFileIndex(fileName, files);
	var file = files[index];
	return {...state, files: [...files.slice(0, index), {...file, ...data}, ...files.slice(index+1)]};
}

const updatePackage = (state, data) => {
	return {...state, info: {...state.info, ...data}};
}

const reducer = (state = initialState, action) => {
	console.log("Action: " + JSON.stringify(action));
	switch (action.type) {
		case 'ERROR':
			alert(action.message);
			return state;
		case 'INIT':
			return {...state, status: action.status, action: action.action, password: action.password, info: {...state.info, wf_status: 'NEW', id: action.id}};
		case 'DOWNLOADED':
			return {...state, info: {...state.info, ...action.data.info, status: 'DOWNLOADED'}, files: action.data.files };
		case 'CLEAR':
			return {...state, info: {...state.info, description: ''}, files: []};
		case 'AUTHORIZED':
			return { ...state, password: action.password, status: 'AUTHORIZED' };
		case 'AUTHORIZATION_FAILED':
			return { ...state, status: 'AUTHORIZATION_FAILED' };
		case 'SET_PACKAGE_STATUS':
			return updatePackage(state, {status: action.status});
		case 'SET_PACKAGE_PROGRESS':
			return updatePackage(state, {status: action.status, progress: action.progress});
		case 'SET_PACKAGE_DESCRIPTION':
			return updatePackage(state, {description: action.description});
		case 'REQUEST_SCAN':
			return {...state, files: [...state.files, { name: randomString(32), type: 'SCAN_REQUEST', status: 'NEW' }]}
		case 'ADD_FILE':
			return {...state, files: [...state.files, { name: action.file.name, status: 'NEW' }]};
		case 'REMOVE_FILE':
			var files = state.files;
			var index = findFileIndex(action.fileName, files);
			return { ...state, files: [...files.slice(0, index), ...files.slice(index+1)] };
		case 'SET_FILE_PROGRESS':
			return updateFile(state, action.fileName, {status: action.status, progress: action.progress});
		case 'SET_FILE_ENCRYPTED_CONTENT':
			return updateFile(state, action.fileName, {status: 'ENCRYPTED', content: action.encryptedFile});
		case 'SET_FILE_DESCRIPTION':
			return updateFile(state, action.fileName, {description: action.description});
		case 'SET_FILE_TO_SIGN':
			return updateFile(state, action.fileName, {toSign: action.toSign});
	}
	return state;
};

export {reducer};