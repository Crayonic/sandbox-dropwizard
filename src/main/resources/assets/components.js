import {dispatcher, eswService} from "exports";

const Spacer = () => (
	<div className="mdl-layout-spacer"> </div>
);

const Row = ({children}) => (
    <div className="mdl-grid">
        {children}
    </div>
);

const Tile = ({children, collSpan = 12, isVisible = true}) => (
    <div
		className={'mdl-card mdl-cell mdl-cell--'+collSpan+'-col mdl-shadow--2dp'}
		style={{ display: isVisible ? 'flex' : 'none' }}>
        {children}
    </div>
);

const TileTitle = ({children}) => (
    <div className="mdl-card__title">
        <h2 className="mdl-card__title-text">
            {children}
        </h2>
    </div>
);

const TileBody = ({children}) => (
    <div className="mdl-card__supporting-text">
        {children}
    </div>
);

const TileActions = ({children}) => (
    <div className="mdl-card__actions mdl-card--border">
        {children}
    </div>
);

const TextBox = ({id, value, label, isVisible, onChange}) => (
    <div className="mdl-textfield mdl-js-textfield esw-full-width" style={{display: isVisible ? 'display-block' : 'none'}}>
      <input className="mdl-textfield__input" type="text" id={id} defaultValue={value} onBlur={onChange}></input>
      <label className="mdl-textfield__label" htmlFor={id} style={{display: isVisible ? 'display-block' : 'none'}}>{label}</label>
    </div>
);

const TextArea = ({id, rows, value, label, isVisible, onChange}) => (
    <div className="mdl-textfield mdl-js-textfield esw-full-width" style={{display: isVisible ? 'display-block' : 'none'}}>
      <textarea className="mdl-textfield__input" type="text" rows={rows} id={id} defaultValue={value} onBlur={onChange}></textarea>
      <label className="mdl-textfield__label" htmlFor={id} style={{display: isVisible ? 'display-block' : 'none'}}>{label}</label>
    </div>
);

const CheckBox = ({id, children, isChecked, isVisible, onChange}) => (
    <label className="mdl-checkbox mdl-js-checkbox mdl-js-ripple-effect" htmlFor={id} style={{display: isVisible ? 'display-block' : 'none'}}>
        <input type="checkbox" id={id} className="mdl-checkbox__input" checked={isChecked} onChange={onChange} />
        <span className="mdl-checkbox__label">{children}</span>
    </label> 
);

const RadioButton = ({id, name, value, children}) => (
    <label className="mdl-radio mdl-js-radio mdl-js-ripple-effect" htmlFor={id}>
        <input className="mdl-radio__button" id={id} name={name} type="radio" value={value}/>
        <span className="mdl-radio__label">{children}</span>
    </label>
);


const Icon = ({name, isVisible = true, children, color = 'grey'}) => (
	<i className={'icon material-icons mdl-color-text--' + color + '-600'} style={{display: isVisible ? 'block' : 'none'}}>{name}</i>
);

const Button = ({onClick, children, isVisible = true, raised = false, colored = false, accent = false}) => (
	<button className={'mdl-button mdl-js-button mdl-js-ripple-effect' + (colored ? ' mdl-button--colored' : '') + (accent ? ' mdl-button--accent' : '') + (raised ? ' mdl-button--raised' : '')}
    	style={{display: isVisible ? 'block' : 'none'}}
        onClick={onClick}>{children}</button>
);

const ButtonLink = ({href, children, target = '', isVisible = true, raised = false, colored = false, accent = false}) => (
	<a className={'mdl-button mdl-js-button mdl-js-ripple-effect' + (colored ? ' mdl-button--colored' : '') + (accent ? ' mdl-button--accent' : '') + (raised ? ' mdl-button--raised' : '')}
		href={href} target={target} style={{display: isVisible ? 'block' : 'none'}}>{children}</a>
);

const PackageContainer = ({store}) => (
    <Row>
		<PackageTile
            collSpan="12"
			action={store.getState().action}
            info={store.getState().info}
			isVisible={store.getState().status == 'AUTHORIZED'}
			onDescriptionChange={(e) => dispatcher.setPackageDescription(e.target.value)} 
			onAddFiles={(e) => dispatcher.addFiles(e.target.files)}
            onRequestScan={() => dispatcher.requestScan()}
			onClearAll={() => dispatcher.clear()}
            onRefresh={() => dispatcher.downloadPackage()}
			onUpload={() => dispatcher.upload('VIEW')}
			onRespond={() => dispatcher.upload('RESPONDED')} />
    </Row>
);

const PackageTile = ({info, action, isVisible, onDescriptionChange, onAddFiles, onRequestScan, onClearAll, onUpload, onRespond, onRefresh, collSpan}) => (
	<Tile collSpan={collSpan} isVisible={isVisible}>
		<TileTitle>
			<Icon name="folder"/> Package
        </TileTitle>
        <TileBody>
			<h4 style={{display: action == 'RESPONDED' ? 'block' : 'none'}}><strong>Your response was sent successfully.</strong></h4>
            <div id="qrcode" style={{display: action == 'VIEW' ? 'block' : 'none'}}></div>
            <TextArea id="packageDesc" rows="2" value={info.description ? info.description : ''} label="Enter package description..." onChange={onDescriptionChange}
                isVisible={action == 'CREATE' || action == 'EDIT'}/>
            <div style={{display: action == 'VIEW' || action == 'RESPONDED' ? 'block' : 'none'}}><strong>Description: </strong> {info.description}</div>
        </TileBody>
        <TileActions>
			<input id="fileBrowser" type="file" multiple="true" style={{display:'none'}} onChange={onAddFiles} />
			<Button colored={true} isVisible={info.wf_status != 'RESPONDED' && (action == 'CREATE' || action == 'EDIT')}
				onClick={() => document.getElementById('fileBrowser').click()}>Add files...</Button>			
			<Button colored={true} isVisible={action == 'CREATE'} onClick={onRequestScan}>Request scan</Button>
			<Button colored={true} isVisible={action == 'CREATE'} onClick={onClearAll}>Clear all</Button>
			<Button colored={true} isVisible={info.wf_status != 'RESPONDED' && (action == 'VIEW' || action == 'EDIT')} onClick={onRefresh}>Refresh</Button>                
			<ButtonLink href={'index.html?action=EDIT&id=' + info.id} target="_new" colored={true} isVisible={info.wf_status != 'RESPONDED' && action == 'VIEW'}>Respond</ButtonLink>
			<ButtonLink href="index.html" colored={true} isVisible={action == 'VIEW'}>New package</ButtonLink>
            <Spacer/>
			<Icon name="drafts" isVisible={info.wf_status == 'NEW'}/>
			<Icon name="create" isVisible={info.wf_status == 'REQUESTED'}/>
			<Icon name="check_circle" isVisible={info.wf_status == 'RESPONDED'} color="green"/>                
			<Button accent={true} raised={true} isVisible={action == 'CREATE'} onClick={onUpload}>Upload</Button>
			<Button accent={true} raised={true} isVisible={info.wf_status != 'RESPONDED' && action == 'EDIT'} onClick={onRespond}>Respond</Button>
        </TileActions>
	</Tile>
);

const FileContainer = ({i, file, store}) => (
	<FileTile
        collSpan="6"
        index={i}
        action={store.getState().action}
        info={store.getState().info}
		file={file}
		isVisible={store.getState().status == 'AUTHORIZED'}
		onDescriptionChange={(e) => dispatcher.setFileDescription(file.name, e.target.value)}
        onToSignChange={(e) => dispatcher.setFileToSign(file.name, e.target.checked)}
        onUpdateFile={(e) => dispatcher.encryptFile(file.name, e.target.files[0])}
		onRemove={() => dispatcher.removeFile(file.name)}
		onDownload={() => dispatcher.saveFile(file.name)} />
);

const FileTile = ({index, action, info, file, isVisible, onDescriptionChange, onToSignChange, onUpdateFile, onRemove, onDownload, collSpan}) => (
	<Tile collSpan={collSpan} isVisible={isVisible}>
        <TileTitle>
			<Icon name={file.type === 'SCAN_REQUEST' ? 'scanner' : 'attachment'}/>
			{file.type === 'SCAN_REQUEST' ? '(Scan request)' : file.name}
		</TileTitle>
		<TileBody>
            <TextArea id={'fileDesc'+index} rows="2" value={file.description ? file.description : ''} label="Enter file description..." onChange={onDescriptionChange} isVisible={action == 'CREATE' || action == 'EDIT'}/>
			<div style={{display: action == 'VIEW' || action == 'RESPONDED' ? 'block' : 'none'}}><strong>Description: </strong> {file.description}</div>
            <CheckBox id={'fileToSign'+index} isChecked={file.toSign} onChange={onToSignChange} isVisible={info.status == 'NEW' && file.type != 'SCAN_REQUEST'}>Document to sign</CheckBox>
        </TileBody>
		<TileActions>
            <input id={'fileBrowser'+index} type="file" multiple="false" style={{display:'none'}} onChange={onUpdateFile} />
			<Button colored={true} isVisible={info.wf_status != 'RESPONDED' && action == 'EDIT'} onClick={() => document.getElementById('fileBrowser'+index).click()}>Update</Button>
			<Button colored={true} isVisible={action != 'CREATE'} onClick={onDownload}>Download</Button>
			<Button accent={true} isVisible={action == 'CREATE'} onClick={onRemove}>Remove</Button>
            <Spacer/>
			<Icon name="lock_open" isVisible={file.status == 'ENCRYPTING' || file.status == 'DECRYPTING'}/>
            <span style={{display: file.status != null && file.status.endsWith('ING') ? 'block' : 'none'}}>{Math.round(file.progress*100)} %</span>
			<Icon name="lock" isVisible={file.status == 'ENCRYPTED'}/>
			<Icon name="get_app" isVisible={file.status == 'SAVED'}/>
		</TileActions>
	</Tile>
);

const FilesContainer = ({store}) => (
	<Row>
		{store.getState().files.map((file, i) =>
			<FileContainer key={i} i={i} file={file} store={store}/>
		)}
	</Row>
);

const SecretTile = ({password, passwordIncorrect, isVisible, collSpan, onPasswordChange}) => (
	<Tile collSpan={collSpan} isVisible={isVisible}>
		<TileTitle>
			<Icon name="vpn_key"/> Enter the secret
		</TileTitle>
		<TileBody>
			<TextBox id="password" value={password} label="Key" onChange={onPasswordChange} isVisible={true}/>
			<div className="mdl-color-text--red-600" style={{display: passwordIncorrect ? 'block' : 'none'}}>
				<Icon name="warning" color="red"/> Incorrect key
			</div>
		</TileBody>
		<TileActions>
			<Button colored={true}>Set</Button>
		</TileActions>
	</Tile>
);

const SecretContainer = ({store}) => (
	<Row>
		<SecretTile
			collSpan="12"				
			password={store.getState().password}
			passwordIncorrect={store.getState().status == 'AUTHORIZATION_FAILED'}
			isVisible={store.getState().status != 'AUTHORIZED'}
			onPasswordChange={(e) => dispatcher.setPassword(e.target.value)}/>
	</Row>
);

const App = ({children, onFilesDrop, dataJson}) => (
    <div className="mdl-layout mdl-js-layout esw-app"
            onDragEnter={(e) => e.preventDefault()}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={(e) => e.preventDefault()}
            onDrop={onFilesDrop}>
		{/*<header className="mdl-layout__header mdl-layout__header--transparent">
    		<div className="mdl-layout__header-row">
    			<span className="mdl-layout-title">eSign Wizard</span>
    		</div>
    	</header>*/}
        <main class="mdl-layout__content">
            {children}
        </main>
        <Row>
        	<div className="mdl-cell mdl-cell--12-col"><b>Model: </b>{dataJson}</div>
        </Row>
    </div>
);

const AppContainer = ({store}) => (
    <App
            onFilesDrop={(e) => { doAddFiles(e.dataTransfer ? e.dataTransfer.files : e.target.files); e.preventDefault(); e.stopPropagation()}}
            dataJson={JSON.stringify(store.getState())}>
		<SecretContainer store={store}/>
	    <PackageContainer store={store}/>
   	    <FilesContainer store={store}/>
    </App>
);
    
export {AppContainer};