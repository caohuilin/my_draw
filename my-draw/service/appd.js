'use strict'
const Wilddog = require('wilddog')
const _ = require('lodash')
const wilddog = new Wilddog('https://wkc-test1.wilddogio.com/')

const online = wilddog.child('online')
const gameState = wilddog.child('gameState')
const chatroom = wilddog.child('chatroom')
const pixelDataRef = wilddog.child('draw1')
const debug = console.log.bind(console)

const username = 'system'

online.update({[username]:Wilddog.ServerValue.TIMESTAMP})

setInterval(()=>{
	online.update({[username]:Wilddog.ServerValue.TIMESTAMP})
}, 10000)


let gameStateValue = null

gameState.on('value', (snapshot)=>{
	gameStateValue = snapshot.val()
})

function onlineUser(users){
	const ans = []
	const serverTime = users['system']
	for(let i in users){
		if(i==='system') continue
		if(i==='.key') continue
		if(serverTime-users[i]>30000) continue
		ans.push(i)
	}
	return ans
}

gameState.once('value', ()=>{
	online.on('value', (snapshot)=>{
		const users = snapshot.val();
		debug('@value', users)
		const now = +new Date()
		const userList = onlineUser(users)
		debug('@userList', userList)
		if(gameStateValue.state == 'WAITING'){
			if(_.keys(users).length >= 3){
				startGame(users)
			}else{
				gameState.update({
					state: 'WAITING'
				})
			}
		}

		if(userList.indexOf(gameStateValue.userNow)==-1){
			startGame(users)
		}
	})
	chatroom.limitToLast(10).on('child_added', (snapshot)=>{
		const newChat = snapshot.val()
		if(newChat.content.indexOf(gameStateValue.problem)!=-1){
			if(newChat.name!=gameStateValue.userNow){
				userSuccess(newChat.name)
			}
		}

	})
})

online.on('child_added', (snapshot)=>{
	var users = snapshot.val();
	debug('@child_added', users)
})

online.on('child_removed', (snapshot)=>{
	var users = snapshot.val();
	debug('@child_removed', users)
})

const Problems = '鸡蛋 太阳 母鸡 水瓶 塔 椅子 台灯 书包 枕头 书'.split(/\s+/).filter(v=>v)

function startGame(users){
	debug('startGame', users)
	const userList = onlineUser(users)
	const userNow = userList[_.random(userList.length-1)]
	const problem = Problems[_.random(Problems.length-1)]
	const newState = {
		state: 'GAME_START',
		userNow,
		problem,
		startTime: Wilddog.ServerValue.TIMESTAMP,
	}
	debug('newState', newState)
	gameState.set(newState)
	chatroom.push({name:'system', content:`开始游戏，${userNow}开始画画`})
}

function userSuccess(username){
	gameState.update({state: 'WAITING'}, ()=>{
		chatroom.push({name:'system', content:`恭喜${username}答对了`})
		pixelDataRef.remove()
		online.update({[username]:Wilddog.ServerValue.TIMESTAMP})
	})
}

