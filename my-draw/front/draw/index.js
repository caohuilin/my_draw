require('./index.less');
console.log('[APP] app start ' + process.env.NODE_ENV);

window.Link = ReactRouter.Link;

const wilddog = new Wilddog('https://wkc-test1.wilddogio.com/');

const online = wilddog.child('online');
const chatroom = wilddog.child('chatroom');
const gameState = wilddog.child('gameState');
const pixelDataRef = wilddog.child('draw1');

const username = location.search.slice(1);

online.update({[username]: Wilddog.ServerValue.TIMESTAMP});

setInterval(()=> {
    online.update({[username]: Wilddog.ServerValue.TIMESTAMP})
}, 10000);

function hashCode(s) {
    var hash = 0, i, chr, len;
    if (s.length === 0) return hash;
    for (i = 0, len = s.length; i < len; i++) {
        chr = s.charCodeAt(i);
        //hash  = ((hash << 5) - hash) + chr;
        //hash |= 0; // Convert to 32bit integer
        hash += chr;
    }
    return hash;
}

const Draw = React.createClass({
    getInitialState(){
        return {}
    },
    componentDidMount(){
        this.canvas = this.refs.canvas;
        window.context = this.context = this.canvas.getContext('2d');
        this.opNow = [];
        this.drawing = false;
        this.context.fillStyle = '#000';
        this.context.lineJoin = 'round';
        this.context.lineCap = 'round';
        this.context.lineWidth = 5;

        pixelDataRef.on('child_added', this.reDrawLine);
        pixelDataRef.on('child_removed', _.throttle(this.clear, 1000))

    },
    clear(){
        debug('clear');
        this.context.fillStyle = '#fff';
        this.context.fillRect(0, 0, this.props.width, this.props.height);
        this.context.fillStyle = '#000';
        this.drawing = false;
        this.opNow = [];
    },
    reDrawLine(snapshot){
        debug('reDrawLine');
        var json = snapshot.val();
        this.drawLine(JSON.parse(json));
    },
    drawLine(pointList){
        debug('drawLine', pointList);
        const l = pointList.length;
        this.drawLineStart(pointList[0], pointList[1]);
        for (let i = 0; i < l; i += 2) {
            this.drawLineMoveQuick(pointList[i], pointList[i + 1]);
        }
        this.drawLineEnd();
    },
    calcXY(x, y){
        const {left, top} = this.canvas.getBoundingClientRect();
        return {x: x - left, y: y - top}
    },
    drawLineStart(x, y){
        debug('drawLineStart');
        this.opNow = [];
        this.drawing = true;
        this.context.beginPath();
        this.context.moveTo(x, y);
    },
    drawLineEnd(){
        console.assert(this.drawing === true)
        debug('drawLineEnd');
        if(this.opNow.length > 0 )pixelDataRef.push(JSON.stringify(this.opNow));
        this.context.stroke();
        this.drawing = false;
    },
    drawLineMove(x, y){
        if (this.drawing) {
            this.opNow.push(x);
            this.opNow.push(y);
            this.context.lineTo(x, y);
            this.context.stroke();
        }
    },
    drawLineMoveQuick(x, y){
        if (this.drawing) {
            this.context.lineTo(x, y);
        }
    },

    componentDidUmount(){

    },
    shouldComponentUpdate(){
        return false
    },
    onMouseDown(event){
        if (this.props.disable) return;
        const {x, y} = this.calcXY(event.clientX, event.clientY);
        this.drawLineStart(x, y)
    },
    onMouseOut(){
        if (this.props.disable) return;
        this.drawLineEnd()
    },
    onMouseUp(){
        if (this.props.disable) return;
        this.drawLineEnd()
    },
    onMouseMove(event){
        if (this.props.disable) return;
        const {x, y} = this.calcXY(event.clientX, event.clientY);
        this.drawLineMove(x, y)
    },


    render(){
        const {width, height} = this.props;
        return (
            <canvas ref="canvas" id="drawing-canvas" width={width} height={height}
                    onMouseDown={this.onMouseDown}
                    onMouseOut={this.onMouseOut}
                    onMouseUp={this.onMouseUp}
                    onMouseMove={this.onMouseMove}
                    style={{cursor:'default', width:width, height:height}}
            >
            </canvas>
        )
    }
});

const Clock = React.createClass({
    getInitialState(){
        return {now: +new Date()}
    },
    componentWillMount(){
        this.clock = setInterval(()=> {
            this.setState({now: +new Date()})
        }, 1000)
    },
    componentWillUnmount(){
        clearInterval(this.clock)
    },
    render(){
        let time = 120 - ((this.state.now - this.props.startTime) / 1000).toFixed()
        if(time<0){
            return <span>游戏结束</span>
        }else{
            return <span>游戏进行中，倒计时：{time}</span>
        }
    }
});
const Online = React.createClass({
    mixins: [WildReact],
    getInitialState(){
        return {online: {}}
    },
    componentDidMount(){
        this.bindAsObject(online, "online")
    },
    onClear(){
        pixelDataRef.remove()
    },
    render(){
        const serverTime = this.state.online['system'];
        const users = _.map(this.state.online, (v, k)=> {
            if (serverTime - v > 30 * 1000) {
                return null
            }
            if (k === 'system') return null;
            if (k === '.key') return null;
            const imgSrc = `./img/head${hashCode(k) % 20 + 1}.jpg`;
            return <li key={k}><img src={imgSrc} alt=""/>{k}</li>
        });
        let gameStatemsg = null;
        let question = null;
        let remind = null;
        let clearButton = null;
        const gameState = this.props.gameState;
        if (gameState) {
            if (gameState.state === 'WAITING') {
                gameStatemsg = <div>请稍等片刻</div>
            } else if (gameState.state === 'GAME_START') {
                gameStatemsg = <div><Clock startTime={gameState.startTime}></Clock></div>
                if (gameState.userNow == username) {
                    question = <div className="ques">{gameState.problem}</div>;
                    clearButton = <div className="clear"><img src="./img/clear.jpg" onClick={this.onClear}/></div>
                }
                if (gameState.userNow != username) {
                    console.log(gameState.remind);
                    remind = <div className="remind">提示：{gameState.remind}</div>
                }
            }
        }
        return (
            <div className="online">
                <ul className="user">
                    {users}
                </ul>
                {question}
                {remind}
                {clearButton}
                {gameStatemsg}
            </div>
        )
    }
});


const Chat = React.createClass({
    mixins: [WildReact],
    getInitialState(){
        return {chatroom: [], value: ''}
    },
    componentDidMount(){
        this.bindAsArray(chatroom.limitToLast(10), "chatroom")
    },
    send(event){
        event.preventDefault();
        if (this.state.value === '') return;
        chatroom.push({name: username, content: this.state.value});
        this.setState({value: ''})
    },
    onChange(event){
        this.setState({value: event.target.value})
    },
    render(){
        const chats = this.state.chatroom.map((v, i)=> {
            const imgSrc = `./img/head${hashCode(v.name) % 20 + 1}.jpg`;
            return (
                <li key={i}><img src={imgSrc} alt=""/>
                    <div className="content">{v.name}:{v.content}</div>
                </li>
            )
        });
        return (
            <div className="chat">
                <div className="img">
                    <img src="./img/icon.jpg" alt=""/>
                </div>
                <header>
                    聊天信息
                </header>
                <ul>
                    {chats}
                </ul>
                <form>
                    <input className="text_input" value={this.state.value} onChange={this.onChange}/>
                    <button className="text_button" type="submit" onClick={this.send}>submit</button>
                </form>
            </div>
        )
    }
});
const App = React.createClass({
    mixins: [WildReact],
    getInitialState(){
        return {gameState: null}
    },
    componentDidMount(){
        this.bindAsObject(gameState, "gameState")
    },
    render(){
        if (!this.state.gameState) return <div>loading</div>;
        const disable = this.state.gameState.userNow === username ? false : true;
        return (
            <div className="app">
                <div className="left">
                    <Draw width={680} height={450} disable={disable}/>
                    <Online gameState={this.state.gameState}/>
                </div>
                <Chat/>
            </div>
        )
    }
});

ReactDOM.render(<App/>, document.getElementById('root'));


