console.log('[APP] app start ' + process.env.NODE_ENV)

window.Link = ReactRouter.Link

const wilddog = new Wilddog('https://wkc-test1.wilddogio.com/')

const online = wilddog.child('online')

const username = location.search.slice(1)

online.update({[username]:true})

online.child(username).onDisconnect().remove()


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
		return {online:{}}
	},
	componentDidMount(){
		this.bindAsObject(online, "online");
	},
	render(){
		const users = _.map(this.state.online, (v, k)=>{
			if(k==='.key') return null
			return <div key={k}>{k}</div>
		})
		return (
			<div>
				<div>
					 在线用户列表:
				</div>
				{users}
			</div>
		)
	}
})

const App = React.createClass({
	render(){
		return <div><Draw width={480} height={420} /><Online/></div>
	}
})

ReactDOM.render(<App/>, document.getElementById('root'))


