(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const CARD_SET = window.GAME_CARDS || [];
  let peer=null, conn=null, seat=null, room='', hand=[], deck=[], discard=[], game=null, timerId=null, selected=new Set(), lock=false, sound=true, opponentColor='#a28bdf';
  const PLAYER_COLORS=['#ff8a71','#67b8d4','#a28bdf','#e8ba4f','#68b98b'];
  let playerColor=PLAYER_COLORS[0];try{const savedColor=localStorage.getItem('upbai-character-color');if(PLAYER_COLORS.includes(savedColor))playerColor=savedColor}catch{}
  const STATUS = {connected:false,started:false};

  const shuffle=(a)=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};
  const say=(t)=>{ $('lobby-message').textContent=t; };
  const toast=(t)=>{const el=$('toast');el.textContent=t;el.classList.add('show');clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),2600)};
  const setOnline=(on,label)=>{STATUS.connected=on;$('connection-label').textContent=label|| (on?'Đã kết nối':'Chưa vào phòng');document.querySelector('.online-dot').classList.toggle('live',on)};
  function setCharacterColor(color){return PLAYER_COLORS.includes(color)?color:PLAYER_COLORS[2]}
  function applyCharacterColors(){const colors=game?.colors||{};$('my-character').style.setProperty('--character-color',setCharacterColor(colors[seat]||playerColor));$('opponent-character').style.setProperty('--character-color',setCharacterColor(colors[seat==='host'?'guest':'host']||opponentColor))}
  $('settings-toggle').onclick=()=>{const panel=$('settings-panel'),open=panel.classList.toggle('hidden')===false;$('settings-toggle').setAttribute('aria-expanded',String(open))};
  document.querySelectorAll('.color-swatch').forEach(button=>{const color=button.dataset.color;button.style.setProperty('--swatch-color',color);button.classList.toggle('chosen',color===playerColor);button.onclick=()=>{playerColor=color;try{localStorage.setItem('upbai-character-color',color)}catch{}$('selected-color-dot').style.color=color;document.querySelectorAll('.color-swatch').forEach(x=>x.classList.toggle('chosen',x===button));toast('Đã đổi màu nhân vật của bạn')}});
  $('selected-color-dot').style.color=playerColor;
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
    conn.on('open',()=>{setOnline(true,'Đã kết nối');showGame();$('opponent-status').textContent='Đã kết nối';$('opponent-name').textContent=seat==='host'?'Người chơi 2':'Người chơi 1';if(seat==='guest'){conn.send({type:'hello',color:playerColor})}});
    conn.on('data',msg=>receive(msg));
    conn.on('close',()=>{setOnline(false,'Đối thủ đã rời phòng');$('opponent-status').textContent='Đối thủ đã rời phòng';if(game&&!game.over){$('turn-title').textContent='Đối thủ đã rời trận';stopTimer()}});
    conn.on('error',()=>toast('Có lỗi trên kết nối phòng.'));
  }
  function send(msg){if(conn&&conn.open)conn.send(msg)}
  function startMatch(remoteColor=opponentColor){
    opponentColor=setCharacterColor(remoteColor);const starter=Math.random()<.5?'host':'guest';game={hp:{host:10,guest:10},shield:{host:0,guest:0},weak:{host:0,guest:0},boost:{host:0,guest:0},decks:{host:19,guest:19},hands:{host:5,guest:5},discards:{host:0,guest:0},colors:{host:playerColor,guest:opponentColor},turn:starter,round:1,over:false};
    hand=[];discard=[];deck=shuffle(CARD_SET);for(let i=0;i<5;i++)hand.push(deck.pop());
    send({type:'setup',starter,round:1,colors:game.colors});STATUS.started=true;showCoin(starter);render();startTimer();
  }
  function receive(m){
    if(!m||typeof m!=='object')return;
    if(m.type==='hello'&&seat==='host'&&!STATUS.started){startMatch(m.color);return}
    if(m.type==='setup'&&seat==='guest'){game={hp:{host:10,guest:10},shield:{host:0,guest:0},weak:{host:0,guest:0},boost:{host:0,guest:0},decks:{host:19,guest:19},hands:{host:5,guest:5},discards:{host:0,guest:0},colors:m.colors||{host:'#a28bdf',guest:playerColor},turn:m.starter,round:1,over:false};hand=[];discard=[];deck=shuffle(CARD_SET);for(let i=0;i<5;i++)hand.push(deck.pop());STATUS.started=true;showCoin(m.starter);render();startTimer();return}
    if(m.type==='action'&&seat==='host'){resolve(m.seat,m.cards||[],m.timeout);return}
    if(m.type==='state'&&seat==='guest'){
      const oldHp=game?.hp?{...game.hp}:{...m.game.hp};
      if(!deck.length&&m.game.decks[seat]>0&&discard.length){deck=shuffle(discard);discard=[]}
      game=m.game;lock=false;
      while(hand.length<game.hands[seat]&&deck.length)hand.push(deck.pop());
      $('battle-log').textContent=m.log||'';
      const pigCard=!!m.reveal?.some(c=>c.effect?.type==='pig_charge');
      if(m.reveal){showPlayed(m.actor===seat?'my-play':'opponent-play',m.reveal);animateDiscard(m.actor,m.reveal[0])}
      if(m.over){stopTimer();finishGame()}
      render();
      if(pigCard){const target=m.actor==='host'?'guest':'host';for(const who of ['host','guest'])if(who!==target)animateDamage(who,oldHp[who]-game.hp[who]);animatePig(m.actor).then(()=>animateDamage(target,oldHp[target]-game.hp[target]))}
      else for(const who of ['host','guest'])animateDamage(who,oldHp[who]-game.hp[who]);
      if(!game.over)startTimer();return
    }
  }
  function showCoin(starter){const modal=$('coin-modal');modal.classList.remove('hidden');$('coin-result').textContent='Đồng xu đang lăn...';setTimeout(()=>{$('coin-result').textContent=(starter===seat?'Bạn':'Đối thủ')+' đi trước!';setTimeout(()=>modal.classList.add('hidden'),1700)},850)}
  function render(){if(!game)return;drawHealth('my-health',game.hp[seat]);drawHealth('opponent-health',game.hp[seat==='host'?'guest':'host']);$('my-deck').textContent=deck.length;$('opponent-deck').textContent=game.decks?.[seat==='host'?'guest':'host']??19;$('my-discard').textContent=game.discards?.[seat]??discard.length;$('opponent-discard').textContent=game.discards?.[seat==='host'?'guest':'host']??0;applyCharacterColors();$('opponent-status').textContent=STATUS.connected?'Đã kết nối':'Đang chờ đối thủ';$('my-status').textContent=game.over?'Trận đấu kết thúc':game.turn===seat?'Đến lượt bạn':'Đang chờ đối thủ';$('turn-title').textContent=game.over?'Trận đấu kết thúc':game.turn===seat?'Đến lượt của bạn!':'Đang chờ đối thủ...';$('turn-pill').textContent=game.over?'KẾT THÚC':game.turn===seat?'LƯỢT CỦA BẠN':'LƯỢT ĐỐI THỦ';$('turn-pill').classList.toggle('active',game.turn===seat&&!game.over);$('play-turn').disabled=game.over||game.turn!==seat||!STATUS.connected;$('deck-warning').textContent=deck.length<=4?'Bộ bài sắp hết':' ';$('restart-btn').classList.toggle('hidden',!game.over);renderHands();updateTimerDisplay();}
  function drawHealth(id,n){const el=$(id);el.innerHTML='';for(let i=0;i<10;i++){const s=document.createElement('span');s.className='heart'+(i>=n?' empty':'');s.textContent=i<n?'♥':'♡';el.appendChild(s)}}
  function renderHands(){const opp=$('opponent-hand');opp.innerHTML='';const other=seat==='host'?'guest':'host',count=game.hands?.[other]??5;for(let i=0;i<count;i++){const c=document.createElement('div');c.className='mini-card';c.style.setProperty('--rot',`${(i-(count-1)/2)*3}deg`);opp.append(c)}const my=$('my-hand');my.innerHTML='';hand.forEach((card,index)=>{const el=document.createElement('button');el.className=`play-card type-${card.type}${selected.has(card.id)?' selected':''}`;el.style.setProperty('--rot',`${(index-(hand.length-1)/2)*2}deg`);el.innerHTML=`<span class="card-category">${card.type==='damage'?'SÁT THƯƠNG':'HIỆU ỨNG'}</span><span class="power">${esc(card.power)}</span><span class="emoji">${card.emoji}</span><strong>${esc(card.name)}</strong><small>${esc(card.text)}</small>`;el.onclick=()=>toggleCard(card);my.append(el)})}
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function toggleCard(card){if(game.turn!==seat||game.over)return;if(selected.has(card.id)){selected.delete(card.id)}else{if(selected.size){toast('Mỗi lượt chỉ đánh được 1 lá.');return}selected.add(card.id)}renderHands();$('selection-hint').textContent=selected.size?'Đã chọn 1 lá · chạm lại để bỏ chọn':'Chọn 1 lá sát thương hoặc 1 lá hiệu ứng';}
  $('play-turn').onclick=()=>submitTurn(false);
  function submitTurn(timeout){if(lock||!game||game.over||game.turn!==seat)return;lock=true;const cards=hand.filter(c=>selected.has(c.id));const payload={type:'action',seat,cards,timeout};if(seat==='host')resolve(seat,cards,timeout);else{hand=hand.filter(c=>!selected.has(c.id));discard.push(...cards);game.hands[seat]=hand.length;render();send(payload);$('play-turn').disabled=true;$('selection-hint').textContent='Đang gửi lượt...'}selected.clear();}
  function resolve(who,cards,timeout){if(!game||game.over||game.turn!==who)return;stopTimer();const hpBefore={...game.hp},seenIds=new Set();cards=(cards||[]).filter(c=>{const card=CARD_SET.find(x=>x.id===c.id);if(!card||seenIds.has(card.id))return false;seenIds.add(card.id);return true}).slice(0,1);const own=who, foe=who==='host'?'guest':'host';let log=timeout?'⏰ Hết giờ! Lượt bị bỏ qua.':cards.length?`${who===seat?'Bạn':who==='host'?'Người chơi 1':'Người chơi 2'} đã ra bài.`:'Lượt này bỏ qua.';
    let dmg=0;for(const c of cards){const original=CARD_SET.find(x=>x.id===c.id);if(!original)continue;const effect=original.effect||{};if(effect.type==='damage'){dmg+=Number(effect.amount)||0}else applyEffect(effect,own,foe)}
    dmg=Math.max(0,dmg+(game.boost[own]?1:0)-(game.weak[own]?1:0));if(game.boost[own])game.boost[own]=0;if(game.weak[own])game.weak[own]=0;if(dmg){const blocked=Math.min(dmg,game.shield[foe]);game.shield[foe]-=blocked;dmg-=blocked;game.hp[foe]=Math.max(0,game.hp[foe]-dmg)}
    const chosenIds=new Set(cards.map(c=>c.id));if(who===seat){hand=hand.filter(c=>!chosenIds.has(c.id));discard.push(...cards);game.hands[seat]=hand.length}else{game.hands[who]=Math.max(0,game.hands[who]-chosenIds.size)}game.discards[who]=(game.discards[who]||0)+cards.length;const reveal=cards.map(c=>CARD_SET.find(x=>x.id===c.id));if(reveal.length){showPlayed(who===seat?'my-play':'opponent-play',reveal);animateDiscard(who,reveal[0]);log+=' · '+reveal.map(c=>c.emoji+' '+c.name).join(' + ')}const pigCard=reveal.some(c=>c.effect?.type==='pig_charge');
    if(game.hp[foe]<=0){game.over=true;game.winner=own;log+=' · '+(own===seat?'Bạn thắng!':'Đối thủ thắng!')}
    if(!game.over){game.turn=foe;game.round++;drawForRound();log+=' · Cả hai rút 1 lá.'}
    $('battle-log').textContent=log;lock=false;render();if(pigCard){for(const player of ['host','guest'])if(player!==foe)animateDamage(player,hpBefore[player]-game.hp[player]);animatePig(who).then(()=>animateDamage(foe,hpBefore[foe]-game.hp[foe]))}else for(const player of ['host','guest'])animateDamage(player,hpBefore[player]-game.hp[player]);if(seat==='host')send({type:'state',game,log,reveal,actor:who,over:game.over});if(game.over)finishGame();else startTimer();
  }
  function applyEffect(effect,own,foe){const amount=Number(effect.amount)||0;switch(effect.type){case'heal':game.hp[own]=Math.min(10,game.hp[own]+amount);break;case'shield':game.shield[own]+=amount;break;case'boost':game.boost[own]+=amount;break;case'damage_opponent':case'pig_charge':game.hp[foe]=Math.max(0,game.hp[foe]-amount);break;case'weaken':game.weak[foe]+=amount;break;case'cleanse':game.weak[own]=0;break;case'heal_and_damage':game.hp[own]=Math.min(10,game.hp[own]+(Number(effect.heal)||0));game.hp[foe]=Math.max(0,game.hp[foe]-(Number(effect.damage)||0));break}}
  function drawForRound(){for(const who of ['host','guest']){if(game.decks[who]===0&&game.discards[who]>0){if(who===seat){deck=shuffle(discard);discard=[]}game.decks[who]+=game.discards[who];game.discards[who]=0}}for(const who of ['host','guest']){if(game.decks[who]<1)continue;if(who===seat){if(!deck.length&&discard.length){deck=shuffle(discard);discard=[];game.decks[who]=deck.length;game.discards[who]=0}if(!deck.length)continue;hand.push(deck.pop())}game.decks[who]--;game.hands[who]++}}
  function showPlayed(id,cards){const el=$(id);el.classList.add('reveal');el.innerHTML=`<small>${id==='my-play'?'BẠN':'ĐỐI THỦ'}</small><span>${cards.map(c=>c.emoji).join('')}</span>`;setTimeout(()=>{if(!game?.over){el.classList.remove('reveal');el.innerHTML=`<small>${id==='my-play'?'BẠN':'ĐỐI THỦ'}</small><span>?</span>`}},3000)}
  async function animatePig(actor){
    const pig=$('pig-runner'),suction=$('pig-suction'),arena=document.querySelector('.arena'),source=$(actor===seat?'my-character':'opponent-character'),target=$(actor===seat?'opponent-character':'my-character');
    if(!pig||!arena||!source||!target)return;
    const base=arena.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect();
    const from={x:a.left+a.width/2-base.left,y:a.top+a.height/2-base.top},to={x:b.left+b.width/2-base.left,y:b.top+b.height/2-base.top};
    const dx=from.x-to.x,dy=from.y-to.y,retreat={x:to.x+dx*.24,y:to.y+dy*.24},pullX=(retreat.x-to.x)*.82,pullY=(retreat.y-to.y)*.82;
    pig.classList.remove('hidden');pig.getAnimations().forEach(animation=>animation.cancel());
    const arrival=pig.animate([{left:`${from.x}px`,top:`${from.y}px`,transform:'translate(-50%,-50%) scale(.62) rotate(0deg)'},{left:`${(from.x+to.x)/2}px`,top:`${(from.y+to.y)/2-34}px`,transform:'translate(-50%,-50%) scale(1.24) rotate(-20deg)',offset:.58},{left:`${to.x}px`,top:`${to.y}px`,transform:'translate(-50%,-50%) scale(1.08) rotate(9deg)'}],{duration:1050,easing:'cubic-bezier(.18,.78,.3,1)'});
    await arrival.finished.catch(()=>{});
    if(suction){suction.style.left=`${to.x}px`;suction.style.top=`${to.y}px`;suction.classList.add('visible');suction.getAnimations().forEach(animation=>animation.cancel())}
    const pull=target.animate([{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'},{transform:`translate(calc(-50% + ${pullX}px),calc(-50% + ${pullY}px)) scale(.16) rotate(24deg)`,offset:.68},{transform:'translate(-50%,-50%) scale(1.18) rotate(-10deg)'},{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'}],{duration:880,easing:'cubic-bezier(.18,.78,.3,1)'});
    const recoil=pig.animate([{left:`${to.x}px`,top:`${to.y}px`,transform:'translate(-50%,-50%) scale(1.1) rotate(0deg)'},{left:`${retreat.x}px`,top:`${retreat.y}px`,transform:'translate(-50%,-50%) scale(1.25) rotate(-24deg)',offset:.48},{left:`${retreat.x}px`,top:`${retreat.y}px`,transform:'translate(-50%,-50%) scale(.82) rotate(8deg)'}],{duration:880,easing:'cubic-bezier(.2,.8,.3,1)'});
    if(suction)suction.animate([{transform:'translate(-50%,-50%) scale(.25) rotate(0deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.18) rotate(190deg)',opacity:1,offset:.38},{transform:'translate(-50%,-50%) scale(.45) rotate(390deg)',opacity:.75,offset:.72},{transform:'translate(-50%,-50%) scale(0) rotate(540deg)',opacity:0}],{duration:880,easing:'ease-in'});
    await Promise.all([pull.finished.catch(()=>{}),recoil.finished.catch(()=>{})]);
    if(suction)suction.classList.remove('visible');pig.classList.add('hidden');
  }
  function animateDiscard(actor,card){if(!card)return;const arena=document.querySelector('.arena'),source=$(actor===seat?'my-play':'opponent-play'),target=$(actor===seat?'my-discard':'opponent-discard'),fly=$('discard-fly');if(!arena||!source||!target||!fly)return;const base=arena.getBoundingClientRect(),a=source.getBoundingClientRect(),b=target.getBoundingClientRect(),from={x:a.left+a.width/2-base.left,y:a.top+a.height/2-base.top},to={x:b.left+b.width/2-base.left,y:b.top+b.height/2-base.top};fly.textContent=card.emoji;fly.classList.add('visible');fly.getAnimations().forEach(animation=>animation.cancel());const animation=fly.animate([{left:`${from.x}px`,top:`${from.y}px`,transform:'translate(-50%,-50%) rotate(0deg) scale(1)',opacity:1},{left:`${to.x}px`,top:`${to.y}px`,transform:'translate(-50%,-50%) rotate(300deg) scale(.35)',opacity:.2}],{duration:850,easing:'cubic-bezier(.3,.75,.35,1)'});animation.onfinish=()=>fly.classList.remove('visible')}
  function animateDamage(who,amount){if(!amount||amount<1)return;const arena=document.querySelector('.arena'),character=$(who===seat?'my-character':'opponent-character'),health=$(who===seat?'my-health':'opponent-health');if(!arena||!character||!health)return;health.classList.remove('damage-flash');void health.offsetWidth;health.classList.add('damage-flash');setTimeout(()=>health.classList.remove('damage-flash'),800);const box=arena.getBoundingClientRect(),target=character.getBoundingClientRect(),float=document.createElement('div');float.className='damage-floater';float.textContent=`−${amount} HP`;float.style.left=`${target.left+target.width/2-box.left}px`;float.style.top=`${target.top-box.top}px`;arena.append(float);character.animate([{transform:'translate(-50%,-50%) scale(1)'},{transform:'translate(calc(-50% - 8px),-50%) rotate(-12deg) scale(1.12)'},{transform:'translate(calc(-50% + 5px),-50%) rotate(9deg) scale(.96)'},{transform:'translate(-50%,-50%) rotate(0) scale(1)'}],{duration:650,easing:'ease-out'});float.animate([{opacity:0,transform:'translate(-50%,0) scale(.7)'},{opacity:1,transform:'translate(-50%,-16px) scale(1.15)',offset:.25},{opacity:0,transform:'translate(-50%,-48px) scale(1)'}],{duration:1000,easing:'ease-out'}).onfinish=()=>float.remove()}
  function startTimer(){stopTimer();if(!game||game.over)return;let remain=60;updateTimer(remain);timerId=setInterval(()=>{remain--;updateTimer(remain);if(remain<=0){stopTimer();if(seat==='host'&&game.turn==='guest'){resolve('guest',[],true)}else if(game.turn===seat){toast('Hết giờ! Lượt của bạn được bỏ qua.');submitTurn(true)}}},1000)}
  function updateTimer(n){$('timer-text').textContent=n;$('timer-circle').style.strokeDashoffset=String(201-(Math.max(0,n)/60*201));$('timer-circle').style.stroke=n<=5?'#e75e54':''}
  function updateTimerDisplay(){if(!game||game.over){$('timer-text').textContent='—';$('timer-circle').style.strokeDashoffset='0'}else if(!timerId){$('timer-text').textContent='60';$('timer-circle').style.strokeDashoffset='0'}}
  function stopTimer(){if(timerId){clearInterval(timerId);timerId=null}}
  function finishGame(){stopTimer();const won=game.winner===seat;$('turn-title').textContent=won?'Bạn thắng rồi!':'Bạn thua mất rồi!';$('turn-pill').textContent=won?'BẠN THẮNG':'BẠN THUA';$('selection-hint').textContent=won?'Đã hạ đối thủ!':'Lần sau phục thù nhé!';$('play-turn').disabled=true;$('restart-btn').classList.remove('hidden');}
  $('restart-btn').onclick=()=>{if(seat==='host'&&conn?.open){STATUS.started=false;startMatch()}else toast('Chủ phòng mới có thể bắt đầu ván mới.');};
  $('copy-link').onclick=async()=>{const url=new URL(location.href);url.hash='room='+room;try{await navigator.clipboard.writeText(url.href);toast('Đã sao chép link phòng!')}catch{prompt('Sao chép link phòng này:',url.href)}};
  function returnToLobby(){stopTimer();if(conn)conn.close();if(peer)peer.destroy();peer=null;conn=null;game=null;hand=[];deck=[];discard=[];selected.clear();STATUS.started=false;setOnline(false,'Chưa vào phòng');$('game').classList.add('hidden');$('lobby').classList.remove('hidden');say('Bạn đã rời phòng. Tạo phòng mới để chơi tiếp nhé.')}
  $('leave-room').onclick=returnToLobby;
  $('back-lobby').onclick=returnToLobby;
  $('sound-btn').onclick=()=>{sound=!sound;$('sound-btn').style.opacity=sound?'1':'.45';toast(sound?'Đã bật âm thanh':'Đã tắt âm thanh')};
  const hash=new URLSearchParams(location.hash.slice(1));if(hash.get('room')){$('room-input').value=hash.get('room').toUpperCase();setTimeout(()=>join(hash.get('room').toUpperCase()),400)}
})();

