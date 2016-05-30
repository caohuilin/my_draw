'use strict';
const Wilddog = require('wilddog');
const _ = require('lodash');
const wilddog = new Wilddog('https://smallchat.wilddogio.com/');

const online = wilddog.child('online');
const gameState = wilddog.child('gameState');
const chatroom = wilddog.child('chatroom');
const pixelDataRef = wilddog.child('draw1');
const debug = console.log.bind(console);

const username = 'system';

online.update({[username]: Wilddog.ServerValue.TIMESTAMP});

//更新用户在线时间
setInterval(()=> {
    online.update({[username]: Wilddog.ServerValue.TIMESTAMP})
}, 10000);


let gameStateValue = null;

//本地维护游戏状态
gameState.on('value', (snapshot)=> {
    gameStateValue = snapshot.val()
});

//计算在线用户
function onlineUser(users) {
    const ans = [];
    const serverTime = users['system'];
    for (let i in users) {
        if (i === 'system') continue;
        if (i === '.key') continue;
        if (serverTime - users[i] > 30000) continue;
        ans.push(i);
    }
    return ans
}

//判断游戏是否超时
function judgeGameTimeout(gameStateValue, users){
    debug('judge timeout', gameStateValue, users)
    if(gameStateValue.state!='GAME_START'){
        return
    }
    const startTime = gameStateValue.startTime
    const userLastTime = users['system']
    if(!userLastTime){
        return
    }
    const runTime = (userLastTime - startTime)/1000
    debug('runTime', runTime)
    if(runTime > 130){
        chatroom.push({name: 'system', content: `游戏超时，重新开始`});
        startGame(users)
    }
}

//每次有用户状态更新时执行一系列操作
// 判断是否超时
//如果游戏未开始并且达到预期的用户在线数目 开始游戏
//如果当前正在画画的用户掉线，重新开始游戏
//如果在聊天记录中找到了正确答案，调用用户猜对的函数
gameState.once('value', ()=> {
    online.on('value', (snapshot)=> {
        const users = snapshot.val();
        judgeGameTimeout(gameStateValue, users)
        debug('@value', users);
        const now = +new Date();
        const userList = onlineUser(users);
        debug('@userList', userList);
        if (gameStateValue.state == 'WAITING') {
            if (_.keys(users).length >= 3) {
                startGame(users)
            } else {
                gameState.update({
                    state: 'WAITING'
                })
            }
        }

        if (userList.indexOf(gameStateValue.userNow) == -1) {
            startGame(users)
        }
    });
    chatroom.limitToLast(10).on('child_added', (snapshot)=> {
        const newChat = snapshot.val();
        if (newChat.content.indexOf(gameStateValue.problem) != -1) {
            if (newChat.name != gameStateValue.userNow) {
                userSuccess(newChat.name)
            }
        }

    })
});

online.on('child_added', (snapshot)=> {
    var users = snapshot.val();
    debug('@child_added', users)
});

online.on('child_removed', (snapshot)=> {
    var users = snapshot.val();
    debug('@child_removed', users)
});

const Problems = '鸡蛋 太阳 母鸡 水瓶 塔 椅子 台灯 书包 枕头 书'.split(/\s+/).filter(v=>v);
const Reminds = '食物 自然界 动物 物体 建筑 家具 家具 学习用品 床上用品 学习用品'.split(/\s+/).filter(v=>v);

//开始游戏
// 在线用户数目至少为2个
//如果存在当前用户，在本地维护的在线用户列表中把当前用户去掉
//随机选取一个用户作为当前用户，随机选取一个问题，开始游戏
function startGame(users) {
    debug('startGame', users);
    let userList = onlineUser(users);
    if (userList.length<2) return;
    // 不要重复选择游戏者
    const oldUserNow = gameStateValue.userNow
    if(oldUserNow){
        userList = userList.filter(v=>v!=oldUserNow)
    }

    const userNow = userList[_.random(userList.length - 1)];
    const index = _.random(Problems.length - 1);
    const problem = Problems[index];
    const remind = Reminds[index];
    const newState = {
        state: 'GAME_START',
        userNow,
        problem,
        remind,
        startTime: Wilddog.ServerValue.TIMESTAMP,
    };
    debug('newState', newState);
    gameState.set(newState);
    chatroom.push({name: 'system', content: `开始游戏，${userNow}开始画画`})
}

//用户答对问题进行的操作，游戏状态置为等待，等待一秒之后发送系统信息，再等一秒,清除画板，
function userSuccess(username) {
    gameState.update({state: 'WAITING'}, ()=> {
        setTimeout(()=> {
            chatroom.push({name: 'system', content: `恭喜${username}答对了`});
            setTimeout(()=>{
                pixelDataRef.remove();
            }, 1000)
            //online.update({[username]: Wilddog.ServerValue.TIMESTAMP})
        }, 1000);

    })
}

