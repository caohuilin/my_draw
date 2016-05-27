const Wilddog = require('wilddog')
const _ = require('lodash')
const wilddog = new Wilddog('https://wkc-test1.wilddogio.com/')

const online = wilddog.child('online')
const gameState = wilddog.child('gameState')
const chatroom = wilddog.child('chatroom')

const debug = console.log.bind(console)

online.on('value', (snapshot)=>{
	var users = snapshot.val();
	debug('@value', users)
	if(_.keys(users).length >= 3){
		startGame(users)
	}else{
		gameState.update({
			state: 'WAITING'
		})
	}
})

online.on('child_added', (snapshot)=>{
	var users = snapshot.val();
	debug('@child_added', JSON.stringify(users))
})

online.on('child_removed', (snapshot)=>{
	var users = snapshot.val();
	debug('@child_removed', users)
})

const Problems = '鸡蛋 太阳 母鸡 水瓶 塔 椅子 台灯 书包 枕头 书'.split(/\s+/).filter(v=>v)

function startGame(users){
	debug('startGame', users)
	const userList = _.keys(users)
	const userNow = userList[_.random(userList.length-1)]
	const problem = Problems[_.random(Problems.length-1)]
	const newState = {
		state: 'GAME_START',
		userNow,
		problem,
	}
	debug('newState', newState)
	gameState.set(newState)
	chatroom.push({name:'system', content:`开始游戏，${userNow}开始画画`})
}

