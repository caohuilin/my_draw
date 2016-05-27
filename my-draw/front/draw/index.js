console.log('[APP] app start ' + process.env.NODE_ENV)

window.Link = ReactRouter.Link

const wilddog = new Wilddog('https://wkc-test1.wilddogio.com/')

const online = wilddog.child('online')
const chatroom = wilddog.child('chatroom')
const gameState = wilddog.child('gameState')

const username = location.search.slice(1)

online.update({[username]:Wilddog.ServerValue.TIMESTAMP})

setInterval(()=>{
	online.update({[username]:Wilddog.ServerValue.TIMESTAMP})
}, 10000)

var pixelDataRef = wilddog.child('draw1')


const Draw = React.createClass({
	getInitialState(){
		return {}
	},
	componentDidMount(){
		this.canvas = this.refs.canvas
		window.context = this.context = this.canvas.getContext('2d')
		this.mouseDown = 0
		this.lastPoint = null
		this.rectArr = {}

		this.context.fillStyle='red'

		pixelDataRef.on('child_added', this.drawPixel, function (error) {
		      if(error.code == "TOO_BIG"){
		        alert("画图信息数据过多 已自动清理画板")
		      }
		      pixelDataRef.remove()
		})
		pixelDataRef.on('child_changed', this.drawPixel)
		pixelDataRef.on('child_removed', this.clearPixel)

	},
	drawPixel(snapshot){
		// debug('drawPixel', snapshot.val(), snapshot.key())
		var [x, y] = snapshot.key().split(':')
		this.context.fillStyle = 'red'
		this.context.fillRect(x, y, 5, 5)
	},
	clearPixel(data){
		// debug('clearPixel', data.val(), data.key())
		var [x, y] = snapshot.key().split(':')
		this.context.fillStyle = 'white'
		this.context.fillRect(x, y, 5, 5)
	},
	componentDidUmount(){

	},
	shouldComponentUpdate(){
		return false
	},
	onMouseDown(event){
		this.mouseDown = 1

		this.drawLineOnMouseMove(event)
	},
	onMouseOut(){
		this.mouseDown = 0

		this.lastPoint = null
		this.drawLineOnMouseMove(event)
	},
	onMouseUp(){
		this.mouseDown = 0

		this.setCanvasLine()
	},
	onMouseMove(event){
		this.drawLineOnMouseMove(event)
	},
	setCanvasLine(){
		pixelDataRef.update(this.rectArr)
		this.rectArr = {}
	},
	drawLineOnMouseMove(event){
		if(!this.mouseDown) return
		event.preventDefault()
		const {clientX, clientY} = event
		// debug('drawLineOnMouseMove', clientX, clientY)
		this.context.fillStyle = 'red'
		this.context.fillRect(clientX, clientY, 5, 5)
		this.rectArr[clientX +":" + clientY] = 1
	},

	render(){
		const {width, height} = this.props
		return (
			<canvas ref="canvas" id="drawing-canvas" width={width} height={height}
				onMouseDown={this.onMouseDown}
				onMouseOut={this.onMouseOut}
				onMouseUp={this.onMouseUp}
				onMouseMove={this.onMouseMove}
			>
			</canvas>
		)
	}
})

const Online = React.createClass({
	mixins: [WildReact],
	getInitialState(){
		return {online:{}, gameState:null}
	},
	componentDidMount(){
		this.bindAsObject(online, "online");
		this.bindAsObject(gameState, "gameState");
	},
	render(){
		const users = _.map(this.state.online, (v, k)=>{
			if(k==='.key') return null
			return <div key={k}>{k}</div>
		})
		let gameStatemsg = null
		let question = null
		const gameState = this.state.gameState
		if(gameState){
			if(gameState.state === 'WAITING'){
				gameStatemsg = <div>人数不足，等待中</div>
			}else if(gameState.state === 'GAME_START'){
				gameStatemsg = <div>游戏进行中</div>
			}
			if(gameState.state === 'GAME_START'){
				if(gameState.userNow == username){
					question = <div>现在轮到你开始游戏，问题是{gameState.problem}</div>
				}
			}
		}
		return (
			<div>
				<div>
					 在线用户列表:
				</div>
				{users}
				{gameStatemsg}
				{question}
			</div>
		)
	}
})

const Chat = React.createClass({
	mixins: [WildReact],
	getInitialState(){
		return {chatroom:[], value:''}
	},
	componentDidMount(){
		this.bindAsArray(chatroom.limitToLast(10), "chatroom");
	},
	send(event){
		event.preventDefault()
		if(this.state.value==='') return
		chatroom.push({name:username, content:this.state.value})
		this.setState({value:''})
	},
	onChange(event){
		this.setState({value:event.target.value})
	},
	render(){
		const chats = this.state.chatroom.map((v, i)=>{
			return (
				<li key={i}>{v.name}:{v.content}</li>
			)
		})
		return (
			<div>
				<div>
					聊天:
				</div>
				<ul>
					{chats}
				</ul>
				<form>
					<input value={this.state.value} onChange={this.onChange}/>
					<input type="submit" onClick={this.send} value="submit"></input>
				</form>
			</div>
			)
	}
})
const App = React.createClass({
	render(){
		return (
			<div>
				<Draw width={480} height={420} />
				<Online/>
				<Chat/>
			</div>
		)
	}
})

ReactDOM.render(<App/>, document.getElementById('root'))


