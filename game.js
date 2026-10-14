(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const CARD_SET = [
    ['damage','Bánh mì bay','🥖','Một ổ bánh mì lao vun vút.','2'],['damage','Gối ôm phản công','🛏️','Êm ái nhưng trúng đau.','2'],['damage','Mưa dép tổ ong','🩴','Dép bay có tổ chức.','3'],['damage','Kẹo dẻo bật nảy','🍡','Dính một phát, đau hai nhịp.','2'],
    ['damage','Vịt cao su giận dữ','🦆','Quạc! Ai cho tắm trước?','2'],['damage','Cà tím vũ trụ','🍆','Đường bay không ai đoán được.','3'],['damage','Nụ cười sát thương','😁','Cười xong mới thấy đau.','1'],['damage','Bánh kem úp mặt','🎂','Chúc mừng sinh nhật nhé!','2'],
    ['damage','Tất thối huyền thoại','🧦','Đòn đánh có mùi rất riêng.','3'],['damage','Cú chọc lét','🪶','Không nhịn được đâu!','1'],['damage','Trà sữa lắc mạnh','🧋','Trân châu bay tứ tung.','2'],['damage','Cục bông thần tốc','☁️','Nhìn mềm, đập khá đau.','2'],
    ['effect','Trà đào hồi sức','🍑','Hồi 2 máu.','+2'],['effect','Ôm một cái','🫂','Hồi 1 máu và thấy đời tươi.','+1'],['effect','Khiên nắp nồi','🍳','Chặn 2 sát thương kế tiếp.','KHIÊN'],['effect','Bùa may mắn','🍀','Đòn kế tiếp mạnh thêm 1.','+1'],
    ['effect','Mèo làm phân tâm','🐈','Đối thủ mất 1 máu vì mải ngắm.','−1'],['effect','Chanh chua bất ngờ','🍋','Đối thủ yếu đi: đòn kế tiếp −1.','−1'],['effect','Đổi gió','🌬️','Xóa hiệu ứng xấu của bạn.','GỠ'],['effect','Bánh quy chia đôi','🍪','Hồi 1 máu, đối thủ cũng đói.','+1/−1'],
    ['effect','Áo mưa phép thuật','🌧️','Chặn 1 sát thương kế tiếp.','KHIÊN'],['effect','Pháo giấy','🎉','Đối thủ mất 1 máu. Tiệc mà!','−1'],['effect','Nước tăng lực','⚡','Đòn kế tiếp mạnh thêm 1.','+1'],['effect','Gửi tim','💌','Hồi 2 máu. Không cần lý do.','+2']
  ].map((c,i)=>({id:`c${i+1}`,type:c[0],name:c[1],emoji:c[2],text:c[3],power:c[4]}));
  let peer=null, conn=null, seat=null, room='', hand=[], deck=[], game=null, timerId=null, selected=new Set(), lock=false, sound=true;
  const STATUS = {connected:false,started:false};

  const shuffle=(a)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
  const say=(t)=>{ $('lobby-message').textContent=t; };
  const toast=(t)=>{const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600)};
  const setOnline=(on,label)=>{STATUS.connected=on;$('connection-label').textContent=label|| (on?'Đã kết nối':'Chưa vào phòng');document.querySelector('.online-dot').classList.toggle('live',on)};
  function showGame(){ $('lobby').classList.add('hidden');$('game').classList.remove('hidden');$('room-code').textContent=room; }
  function makePeer(id){
    if(!window.Peer){say('Không tải được dịch vụ kết nối. Kiểm tra mạng rồi tải lại trang.');return}
    peer=new Peer(id,{debug:1});
    peer.on('error',e=>{const msg=e.type==='peer-unavailable'?'Không tìm thấy phòng này. Hãy kiểm tra mã/link.':e.type==='unavailable-id'?'Mã phòng đang được dùng, hãy tạo lại phòng.':'Lỗi kết nối: '+e.type;say(msg);toast(msg);if(e.type==='unavailable-id'){peer.destroy();peer=null}});
    peer.on('disconnected',()=>{if(STATUS.connected){setOnline(false,'Mất kết nối');$('opponent-status').textContent='Mất kết nối';toast('Mất kết nối với đối thủ.')}});
    peer.on('connection',c=>{if(conn&&conn.open){c.close();return}conn=c;seat='host';wire();});
    peer.on('open',()=>{if(seat==='host'){room=id;$('room-code').textContent=room;showGame();setOnline(false,'Đang chờ đối thủ');$('opponent-status').textContent='Đang chờ bạn vào phòng';$('turn-title').textContent='Đang chờ đối thủ...';say('Đã tạo phòng '+room+'. Gửi link cho bạn chơi nhé.');} });
  }
  $('create-room').onclick=()=>{if(peer)peer.destroy();seat='host';const id=Math.random().toString(36).slice(2,8).toUpperCase();say('Đang tạo phòng...');makePeer(id)};
  $('join-room').onclick=()=>join($('room-input').value.trim().toUpperCase());
  $('room-input').addEventListener('keydown',e=>{if(e.key==='Enter')join($('room-input').value.trim().toUpperCase())});
  function join(id){if(!id){say('Nhập mã phòng để tham gia.');return}if(!window.Peer){say('Không tải được dịch vụ kết nối.');return}room=id;seat='guest';say('Đang kết nối phòng '+room+'...');peer=new Peer(undefined,{debug:1});peer.on('open',()=>{conn=peer.connect(room,{reliable:true});wire()});peer.on('error',e=>{const msg=e.type==='peer-unavailable'?'Không tìm thấy phòng. Hãy xin link mới từ chủ phòng.':'Lỗi kết nối: '+e.type;say(msg);toast(msg)});}
  function wire(){
    conn.on('open',()=>{setOnline(true,'Đã kết nối');showGame();$('opponent-status').textContent='Đã kết nối';$('opponent-name').textContent=seat==='host'?'Người chơi 2':'Người chơi 1';if(seat==='host'){startMatch()}else{conn.send({type:'hello'})}});
    conn.on('data',msg=>receive(msg));
    conn.on('close',()=>{setOnline(false,'Đối thủ đã rời phòng');$('opponent-status').textContent='Đối thủ đã rời phòng';if(game&&!game.over){$('turn-title').textContent='Đối thủ đã rời trận';stopTimer()}});
    conn.on('error',()=>toast('Có lỗi trên kết nối phòng.'));
  }
  function send(msg){if(conn&&conn.open)conn.send(msg)}
  function startMatch(){
    const starter=Math.random()<.5?'host':'guest';game={hp:{host:10,guest:10},shield:{host:0,guest:0},weak:{host:0,guest:0},boost:{host:0,guest:0},decks:{host:19,guest:19},hands:{host:5,guest:5},turn:starter,round:1,over:false};
    hand=[];deck=shuffle(CARD_SET);for(let i=0;i<5;i++)hand.push(deck.pop());
    send({type:'setup',starter,round:1});STATUS.started=true;showCoin(starter);render();startTimer();
  }
  function receive(m){
    if(!m||typeof m!=='object')return;
    if(m.type==='hello'&&seat==='host'&&!STATUS.started){startMatch();return}
    if(m.type==='setup'&&seat==='guest'){game={hp:{host:10,guest:10},shield:{host:0,guest:0},weak:{host:0,guest:0},boost:{host:0,guest:0},decks:{host:19,guest:19},hands:{host:5,guest:5},turn:m.starter,round:1,over:false};hand=[];deck=shuffle(CARD_SET);for(let i=0;i<5;i++)hand.push(deck.pop());STATUS.started=true;showCoin(m.starter);render();startTimer();return}
    if(m.type==='action'&&seat==='host'){resolve(m.seat,m.cards||[],m.timeout);return}
    if(m.type==='state'&&seat==='guest'){game=m.game;lock=false;while(hand.length<game.hands[seat]&&deck.length)hand.push(deck.pop());$('battle-log').textContent=m.log||'';if(m.reveal){showPlayed(m.actor===seat?'my-play':'opponent-play',m.reveal)}if(m.over){stopTimer();finishGame()}render();if(!game.over)startTimer();return}
  }
  function showCoin(starter){const modal=$('coin-modal');modal.classList.remove('hidden');$('coin-result').textContent='Đồng xu đang lăn...';setTimeout(()=>{$('coin-result').textContent=(starter===seat?'Bạn':'Đối thủ')+' đi trước!';setTimeout(()=>modal.classList.add('hidden'),1700)},850)}
  function render(){if(!game)return;drawHealth('my-health',game.hp[seat]);drawHealth('opponent-health',game.hp[seat==='host'?'guest':'host']);$('my-deck').textContent=deck.length;$('opponent-deck').textContent=game.decks?.[seat==='host'?'guest':'host']??19;$('opponent-status').textContent=STATUS.connected?'Đã kết nối':'Đang chờ đối thủ';$('my-status').textContent=game.over?'Trận đấu kết thúc':game.turn===seat?'Đến lượt bạn':'Đang chờ đối thủ';$('turn-title').textContent=game.over?'Trận đấu kết thúc':game.turn===seat?'Đến lượt của bạn!':'Đang chờ đối thủ...';$('turn-pill').textContent=game.over?'KẾT THÚC':game.turn===seat?'LƯỢT CỦA BẠN':'LƯỢT ĐỐI THỦ';$('turn-pill').classList.toggle('active',game.turn===seat&&!game.over);$('play-turn').disabled=game.over||game.turn!==seat||!STATUS.connected;$('deck-warning').textContent=deck.length<=4?'Còn '+deck.length+' lá trong bộ bài':'';$('restart-btn').classList.toggle('hidden',!game.over);renderHands();updateTimerDisplay();}
  function drawHealth(id,n){const el=$(id);el.innerHTML='';for(let i=0;i<10;i++){const s=document.createElement('span');s.className='heart'+(i>=n?' empty':'');s.textContent=i<n?'♥':'♡';el.appendChild(s)}}
  function renderHands(){const opp=$('opponent-hand');opp.innerHTML='';const other=seat==='host'?'guest':'host',count=game.hands?.[other]??5;for(let i=0;i<count;i++){const c=document.createElement('div');c.className='mini-card';c.style.setProperty('--rot',`${(i-(count-1)/2)*3}deg`);opp.append(c)}const my=$('my-hand');my.innerHTML='';hand.forEach((card,index)=>{const el=document.createElement('button');el.className=`play-card type-${card.type}${selected.has(card.id)?' selected':''}`;el.style.setProperty('--rot',`${(index-(hand.length-1)/2)*2}deg`);el.innerHTML=`<span class="card-category">${card.type==='damage'?'SÁT THƯƠNG':'HIỆU ỨNG'}</span><span class="power">${esc(card.power)}</span><span class="emoji">${card.emoji}</span><strong>${esc(card.name)}</strong><small>${esc(card.text)}</small>`;el.onclick=()=>toggleCard(card);my.append(el)})}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toggleCard(card){if(game.turn!==seat||game.over)return;if(selected.has(card.id)){selected.delete(card.id)}else{const same=[...selected].map(id=>hand.find(c=>c.id===id)).filter(c=>c?.type===card.type);if(same.length){toast(card.type==='damage'?'Mỗi lượt chỉ đánh 1 lá sát thương.':'Mỗi lượt chỉ đánh 1 lá hiệu ứng.');return}selected.add(card.id)}renderHands();$('selection-hint').textContent=selected.size?'Đã chọn '+selected.size+' lá · có thể bỏ chọn bằng cách chạm lại':'Chọn tối đa 1 lá sát thương và 1 lá hiệu ứng';}
  $('play-turn').onclick=()=>submitTurn(false);
  function submitTurn(timeout){if(lock||!game||game.over||game.turn!==seat)return;lock=true;const cards=hand.filter(c=>selected.has(c.id));const payload={type:'action',seat,cards,timeout};if(seat==='host')resolve(seat,cards,timeout);else{hand=hand.filter(c=>!selected.has(c.id));game.hands[seat]=hand.length;render();send(payload);$('play-turn').disabled=true;$('selection-hint').textContent='Đang gửi lượt...'}selected.clear();}
  function resolve(who,cards,timeout){if(!game||game.over||game.turn!==who)return;stopTimer();const seenIds=new Set(),seenTypes=new Set();cards=(cards||[]).filter(c=>{const card=CARD_SET.find(x=>x.id===c.id);if(!card||seenIds.has(card.id)||seenTypes.has(card.type))return false;seenIds.add(card.id);seenTypes.add(card.type);return true}).slice(0,2);const own=who, foe=who==='host'?'guest':'host';let log=timeout?'⏰ Hết giờ! Lượt bị bỏ qua.':cards.length?`${who===seat?'Bạn':who==='host'?'Người chơi 1':'Người chơi 2'} đã ra bài.`:'Lượt này bỏ qua.';
    let dmg=0;for(const c of cards){const original=CARD_SET.find(x=>x.id===c.id);if(!original)continue;if(c.type==='damage'){dmg+=Number(original.power)||0}else{switch(original.id){case'c13':case'c24':game.hp[own]=Math.min(10,game.hp[own]+2);break;case'c14':game.hp[own]=Math.min(10,game.hp[own]+1);break;case'c15':game.shield[own]+=2;break;case'c16':game.boost[own]++;break;case'c17':case'c22':game.hp[foe]=Math.max(0,game.hp[foe]-1);break;case'c18':game.weak[foe]++;break;case'c19':game.weak[own]=0;break;case'c20':game.hp[own]=Math.min(10,game.hp[own]+1);game.hp[foe]=Math.max(0,game.hp[foe]-1);break;case'c21':game.shield[own]++;break;case'c23':game.boost[own]++;break;}}}
    dmg=Math.max(0,dmg+(game.boost[own]?1:0)-(game.weak[own]?1:0));if(game.boost[own])game.boost[own]=0;if(game.weak[own])game.weak[own]=0;if(dmg){const blocked=Math.min(dmg,game.shield[foe]);game.shield[foe]-=blocked;dmg-=blocked;game.hp[foe]=Math.max(0,game.hp[foe]-dmg)}
    const chosenIds=new Set(cards.map(c=>c.id));if(who===seat){hand=hand.filter(c=>!chosenIds.has(c.id));game.hands[seat]=hand.length}else{game.hands[who]=Math.max(0,game.hands[who]-chosenIds.size)}const reveal=cards.map(c=>CARD_SET.find(x=>x.id===c.id));if(reveal.length){showPlayed(who===seat?'my-play':'opponent-play',reveal);log+=' · '+reveal.map(c=>c.emoji+' '+c.name).join(' + ')}
    if(game.hp[foe]<=0){game.over=true;game.winner=own;log+=' · '+(own===seat?'Bạn thắng!':'Đối thủ thắng!')}
    if(!game.over){game.turn=foe;game.round++;const drew=drawForTurn(foe);if(drew==='tie'){game.over=true;game.winner='tie';log+=' · Hết bài, trận hòa!'}else if(foe===seat){log+=' · Bạn rút 2 lá.'}}
    $('battle-log').textContent=log;lock=false;render();if(seat==='host')send({type:'state',game,log,reveal,actor:who,over:game.over});if(game.over)finishGame();else startTimer();
  }
  function drawForTurn(who){const amount=Math.min(2,game.decks[who]);for(let i=0;i<amount;i++){game.decks[who]--;if(who===seat)hand.push(deck.pop())}game.hands[who]+=amount;if(amount<2)return'tie';return'ok'}
  function showPlayed(id,cards){const el=$(id);el.classList.add('reveal');el.innerHTML=`<small>${id==='my-play'?'BẠN':'ĐỐI THỦ'}</small><span>${cards.map(c=>c.emoji).join('')}</span>`;setTimeout(()=>{if(!game?.over){el.classList.remove('reveal');el.innerHTML=`<small>${id==='my-play'?'BẠN':'ĐỐI THỦ'}</small><span>?</span>`}},3000)}
  function startTimer(){stopTimer();if(!game||game.over)return;let remain=20;updateTimer(remain);timerId=setInterval(()=>{remain--;updateTimer(remain);if(remain<=0){stopTimer();if(seat==='host'&&game.turn==='guest'){resolve('guest',[],true)}else if(game.turn===seat){toast('Hết giờ! Lượt của bạn được bỏ qua.');submitTurn(true)}}},1000)}
  function updateTimer(n){$('timer-text').textContent=n;$('timer-circle').style.strokeDashoffset=String(201-(Math.max(0,n)/20*201));$('timer-circle').style.stroke=n<=5?'#e75e54':''}
  function updateTimerDisplay(){if(!game||game.over){$('timer-text').textContent='—';$('timer-circle').style.strokeDashoffset='0'}else if(!timerId){$('timer-text').textContent='20';$('timer-circle').style.strokeDashoffset='0'}}
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
  function finishGame(){stopTimer();const won=game.winner==='tie'?null:game.winner===seat;$('turn-title').textContent=game.winner==='tie'?'Hòa nhau!':won?'Bạn thắng rồi!':'Bạn thua mất rồi!';$('turn-pill').textContent=game.winner==='tie'?'HÒA':won?'BẠN THẮNG':'BẠN THUA';$('selection-hint').textContent=game.winner==='tie'?'Bộ bài hết rồi, hòa nha.':won?'Đã hạ đối thủ!':'Lần sau phục thù nhé!';$('play-turn').disabled=true;$('restart-btn').classList.remove('hidden');}
  $('restart-btn').onclick=()=>{if(seat==='host'&&conn?.open){STATUS.started=false;startMatch()}else toast('Chủ phòng mới có thể bắt đầu ván mới.');};
  $('copy-link').onclick=async()=>{const url=new URL(location.href);url.hash='room='+room;try{await navigator.clipboard.writeText(url.href);toast('Đã sao chép link phòng!')}catch{prompt('Sao chép link phòng này:',url.href)}};
  $('leave-room').onclick=()=>{stopTimer();if(conn)conn.close();if(peer)peer.destroy();peer=null;conn=null;game=null;hand=[];deck=[];STATUS.started=false;setOnline(false,'Chưa vào phòng');$('game').classList.add('hidden');$('lobby').classList.remove('hidden');say('Bạn đã rời phòng. Tạo phòng mới để chơi tiếp nhé.')};
  $('sound-btn').onclick=()=>{sound=!sound;$('sound-btn').style.opacity=sound?'1':'.45';toast(sound?'Đã bật âm thanh':'Đã tắt âm thanh')};
  const hash=new URLSearchParams(location.hash.slice(1));if(hash.get('room')){$('room-input').value=hash.get('room').toUpperCase();setTimeout(()=>join(hash.get('room').toUpperCase()),400)}
})();
