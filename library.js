(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cards = window.GAME_CARDS || [];
  const modal = $('card-library');
  const grid = $('library-grid');
  const board = $('preview-board');
  let selectedCard = null;
  let running = false;
  let myHp = 7;
  let opponentHp = 8;
  let previewShield = 0;
  let previewBoost = 0;
  let previewWeak = 0;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function drawHealth(id, hp) {
    const el = $(id);
    el.innerHTML = Array.from({length:10}, (_, i) => `<span class="${i < hp ? 'alive' : ''}">${i < hp ? '♥' : '♡'}</span>`).join('');
  }

  function renderHealth() {
    drawHealth('preview-my-health', myHp);
    drawHealth('preview-opponent-health', opponentHp);
  }

  function resetBoard() {
    myHp = 7;
    opponentHp = 8;
    previewShield = 0;
    previewBoost = 0;
    previewWeak = 0;
    $('preview-my-status').textContent = 'Sẵn sàng sử dụng bài';
    $('preview-opponent-status').textContent = 'Sẵn sàng nhận hiệu ứng';
    $('preview-log').textContent = selectedCard ? `Bàn đã đặt lại. Nhấn “Thử hiệu ứng” để xem ${selectedCard.name}.` : 'Chọn một lá bài để bắt đầu.';
    renderHealth();
  }

  function renderLibrary() {
    grid.innerHTML = cards.map((card) => `<button type="button" class="library-card type-${escapeHtml(card.type)}${selectedCard?.id === card.id ? ' selected' : ''}" data-card-id="${escapeHtml(card.id)}" aria-label="Thử ${escapeHtml(card.name)}">
      <span class="card-category">${card.type === 'damage' ? 'SÁT THƯƠNG' : 'HIỆU ỨNG'}</span><span class="power">${escapeHtml(card.power)}</span><span class="emoji">${escapeHtml(card.emoji)}</span><strong>${escapeHtml(card.name)}</strong><small>${escapeHtml(card.text)}</small>
    </button>`).join('');
    grid.querySelectorAll('.library-card').forEach((button) => button.addEventListener('click', () => {
      selectedCard = cards.find((card) => card.id === button.dataset.cardId) || null;
      renderLibrary();
      renderSelectedCard();
      runPreview();
    }));
  }

  function renderSelectedCard() {
    const card = selectedCard;
    $('preview-card').className = `preview-card${card ? ` type-${card.type}` : ''}`;
    $('preview-category').textContent = card ? (card.type === 'damage' ? 'SÁT THƯƠNG' : 'HIỆU ỨNG') : 'CHỌN MỘT LÁ';
    $('preview-power').textContent = card?.power || '✦';
    $('preview-emoji').textContent = card?.emoji || '🃏';
    $('preview-name').textContent = card?.name || 'Lá bài sẽ hiện ở đây';
    $('preview-text').textContent = card?.text || 'Nhấn vào bất kỳ lá bài nào trong thư viện để thử hiệu ứng.';
    $('preview-again').disabled = !card || running;
  }

  function openLibrary() {
    modal.classList.remove('hidden');
    renderLibrary();
    renderSelectedCard();
    resetBoard();
    $('close-library').focus();
  }

  function closeLibrary() {
    if (running) return;
    modal.classList.add('hidden');
  }

  function animateCharacter(id) {
    const character = $(id);
    character.animate([
      { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)' },
      { transform: 'translate(calc(-50% - 9px),-50%) scale(1.16) rotate(-13deg)', offset: .32 },
      { transform: 'translate(calc(-50% + 5px),-50%) scale(.94) rotate(9deg)', offset: .68 },
      { transform: 'translate(-50%,-50%) scale(1) rotate(0deg)' }
    ], { duration: 720, easing: 'ease-out' });
    character.classList.remove('hit');
    void character.offsetWidth;
    character.classList.add('hit');
    setTimeout(() => character.classList.remove('hit'), 750);
  }

  function showDamage(id, amount) {
    if (amount < 1) return;
    const health = $(id);
    health.classList.remove('damage-flash');
    void health.offsetWidth;
    health.classList.add('damage-flash');
    setTimeout(() => health.classList.remove('damage-flash'), 850);
    const character = $(id === 'preview-my-health' ? 'preview-my-character' : 'preview-opponent-character');
    animateCharacter(character.id);
    const base = board.getBoundingClientRect();
    const target = character.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = 'preview-floater damage';
    floater.textContent = `−${amount} HP`;
    floater.style.left = `${target.left + target.width / 2 - base.left}px`;
    floater.style.top = `${target.top - base.top}px`;
    board.append(floater);
    floater.animate([{opacity:0,transform:'translate(-50%,0) scale(.7)'},{opacity:1,transform:'translate(-50%,-15px) scale(1.18)',offset:.25},{opacity:0,transform:'translate(-50%,-54px) scale(1)'}],{duration:1100,easing:'ease-out'}).onfinish=()=>floater.remove();
  }

  function showGain(id, amount, label = 'HP') {
    if (amount < 1) return;
    const character = $(id);
    const base = board.getBoundingClientRect();
    const target = character.getBoundingClientRect();
    const floater = document.createElement('div');
    floater.className = 'preview-floater gain';
    floater.textContent = `+${amount} ${label}`;
    floater.style.left = `${target.left + target.width / 2 - base.left}px`;
    floater.style.top = `${target.top - base.top}px`;
    board.append(floater);
    character.animate([{filter:'brightness(1)'},{filter:'brightness(1.5)'},{filter:'brightness(1)'}],{duration:700});
    floater.animate([{opacity:0,transform:'translate(-50%,0) scale(.7)'},{opacity:1,transform:'translate(-50%,-15px) scale(1.12)',offset:.25},{opacity:0,transform:'translate(-50%,-46px) scale(1)'}],{duration:1000,easing:'ease-out'}).onfinish=()=>floater.remove();
  }

  function flyCardToOpponent(card) {
    const start = $('preview-card').getBoundingClientRect();
    const end = $('preview-opponent-character').getBoundingClientRect();
    const base = board.getBoundingClientRect();
    const projectile = document.createElement('div');
    projectile.className = 'preview-projectile';
    projectile.textContent = card.emoji;
    board.append(projectile);
    const x1 = start.left + start.width / 2 - base.left;
    const y1 = start.top + start.height / 2 - base.top;
    const x2 = end.left + end.width / 2 - base.left;
    const y2 = end.top + end.height / 2 - base.top;
    projectile.animate([{left:`${x1}px`,top:`${y1}px`,transform:'translate(-50%,-50%) rotate(0) scale(.7)'},{left:`${(x1+x2)/2}px`,top:`${(y1+y2)/2-25}px`,transform:'translate(-50%,-50%) rotate(180deg) scale(1.18)',offset:.55},{left:`${x2}px`,top:`${y2}px`,transform:'translate(-50%,-50%) rotate(380deg) scale(.4)',opacity:.45}],{duration:780,easing:'cubic-bezier(.2,.8,.3,1)'}).onfinish=()=>projectile.remove();
  }

  async function flyPig() {
    const pig = $('preview-pig');
    const suction = $('preview-suction');
    const airflow = $('preview-airflow');
    const target = $('preview-opponent-character');
    const base = board.getBoundingClientRect();
    const a = $('preview-my-character').getBoundingClientRect();
    const b = target.getBoundingClientRect();
    const from = {x:a.left+a.width/2-base.left,y:a.top+a.height/2-base.top};
    const to = {x:b.left+b.width/2-base.left,y:b.top+b.height/2-base.top};
    const dx=from.x-to.x,dy=from.y-to.y;
    const retreat={x:to.x+dx*.34,y:to.y+dy*.34};
    const pullX=(retreat.x-to.x)*.92,pullY=(retreat.y-to.y)*.92;
    pig.classList.add('visible');
    pig.getAnimations().forEach((animation)=>animation.cancel());
    const arrival=pig.animate([{left:`${from.x}px`,top:`${from.y}px`,transform:'translate(-50%,-50%) scale(.6)'},{left:`${(from.x+to.x)/2}px`,top:`${(from.y+to.y)/2-28}px`,transform:'translate(-50%,-50%) scale(1.2) rotate(-15deg)',offset:.55},{left:`${to.x}px`,top:`${to.y}px`,transform:'translate(-50%,-50%) scale(1.05) rotate(8deg)'}],{duration:1000,easing:'cubic-bezier(.18,.78,.3,1)'});
    await arrival.finished.catch(()=>{});
    const distance=Math.hypot(retreat.x-to.x,retreat.y-to.y),angle=Math.atan2(retreat.y-to.y,retreat.x-to.x)*180/Math.PI;
    suction.style.left=`${retreat.x}px`;
    suction.style.top=`${retreat.y}px`;
    suction.classList.add('visible');
    suction.getAnimations().forEach((animation)=>animation.cancel());
    if(airflow){airflow.style.left=`${to.x}px`;airflow.style.top=`${to.y}px`;airflow.style.width=`${distance}px`;airflow.style.setProperty('--flow-angle',`${angle}deg`);airflow.style.setProperty('--airflow-distance',`${distance}px`);airflow.classList.add('visible');airflow.getAnimations().forEach((animation)=>animation.cancel())}
    const pull=target.animate([{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'},{transform:`translate(calc(-50% + ${pullX*.55}px),calc(-50% + ${pullY*.55}px)) scale(.58) rotate(17deg)`,offset:.48},{transform:`translate(calc(-50% + ${pullX}px),calc(-50% + ${pullY}px)) scale(.08) rotate(-22deg)`,offset:.73},{transform:'translate(-50%,-50%) scale(1.2) rotate(13deg)',offset:.87},{transform:'translate(-50%,-50%) scale(1) rotate(0deg)'}],{duration:1050,easing:'cubic-bezier(.18,.78,.3,1)'});
    const recoil=pig.animate([{left:`${to.x}px`,top:`${to.y}px`,transform:'translate(-50%,-50%) scale(1.08) rotate(0deg)'},{left:`${retreat.x}px`,top:`${retreat.y}px`,transform:'translate(-50%,-50%) scale(1.45) rotate(-26deg)',offset:.48},{left:`${retreat.x}px`,top:`${retreat.y}px`,transform:'translate(-50%,-50%) scale(1.18) rotate(8deg)'}],{duration:1050,easing:'cubic-bezier(.2,.8,.3,1)'});
    suction.animate([{transform:'translate(-50%,-50%) scale(.18) rotate(0deg)',opacity:0},{transform:'translate(-50%,-50%) scale(1.32) rotate(170deg)',opacity:1,offset:.38},{transform:'translate(-50%,-50%) scale(.82) rotate(370deg)',opacity:.9,offset:.75},{transform:'translate(-50%,-50%) scale(0) rotate(560deg)',opacity:0}],{duration:1050,easing:'ease-in'});
    if(airflow)airflow.animate([{transform:'rotate(var(--flow-angle)) scaleX(.02)',opacity:0},{transform:'rotate(var(--flow-angle)) scaleX(1)',opacity:.95,offset:.24},{transform:'rotate(var(--flow-angle)) scaleX(.86)',opacity:.82,offset:.72},{transform:'rotate(var(--flow-angle)) scaleX(0)',opacity:0}],{duration:1050,easing:'cubic-bezier(.2,.7,.35,1)'});
    board.animate([{transform:'translateX(0)'},{transform:'translateX(-4px) rotate(-.25deg)',offset:.28},{transform:'translateX(4px) rotate(.25deg)',offset:.56},{transform:'translateX(-2px)',offset:.78},{transform:'translateX(0)'}],{duration:420,easing:'ease-out'});
    await Promise.all([pull.finished.catch(()=>{}),recoil.finished.catch(()=>{})]);
    suction.classList.remove('visible');
    if(airflow)airflow.classList.remove('visible');
    pig.classList.remove('visible');
  }

  async function runPreview() {
    if (!selectedCard || running) return;
    running = true;
    $('preview-again').disabled = true;
    resetBoard();
    const card = selectedCard;
    const effect = card.effect || {};
    const notes = [];
    let damage = 0;
    if (effect.type === 'damage') damage = Math.max(0, Number(effect.amount) || 0) + previewBoost - previewWeak;
    else if (effect.type === 'pig_charge') damage = Math.max(0, Number(effect.amount) || 0);
    else if (effect.type === 'damage_opponent') damage = Math.max(0, Number(effect.amount) || 0);
    else if (effect.type === 'heal_and_damage') damage = Math.max(0, Number(effect.damage) || 0);

    if (effect.type === 'pig_charge') {
      $('preview-log').textContent = 'Heo đang nhảy sang sân đối thủ…';
      await flyPig();
      opponentHp = Math.max(0, opponentHp - damage);
      renderHealth();
      showDamage('preview-opponent-health', damage);
      notes.push(`đối thủ mất ${damage} máu`);
    } else {
      if (effect.type === 'damage' || effect.type === 'damage_opponent' || effect.type === 'heal_and_damage') {
        if (effect.type === 'damage') {
          damage = Math.max(0, damage);
          if (previewWeak) notes.push('đòn đánh giảm sức mạnh');
          if (previewBoost) notes.push('đòn đánh được tăng sức mạnh');
          previewBoost = 0;
          previewWeak = 0;
        }
        const blocked = Math.min(damage, previewShield);
        previewShield -= blocked;
        damage -= blocked;
        if (blocked) notes.push(`khiên chặn ${blocked} sát thương`);
        if (damage > 0) {
          flyCardToOpponent(card);
          await new Promise((resolve) => setTimeout(resolve, 430));
          opponentHp = Math.max(0, opponentHp - damage);
          renderHealth();
          showDamage('preview-opponent-health', damage);
          notes.push(`đối thủ mất ${damage} máu`);
        }
      }
      switch (effect.type) {
        case 'heal': {
          const before = myHp;
          myHp = Math.min(10, myHp + (Number(effect.amount) || 0));
          const healed = myHp - before;
          renderHealth();
          showGain('preview-my-character', healed);
          if (healed) notes.push(`bạn hồi ${healed} máu`);
          break;
        }
        case 'shield':
          previewShield += Number(effect.amount) || 0;
          $('preview-my-status').textContent = `Khiên ${previewShield} · chặn sát thương`;
          showGain('preview-my-character', Number(effect.amount) || 0, 'KHIÊN');
          notes.push(`bạn nhận ${effect.amount} khiên`);
          break;
        case 'boost':
          previewBoost += Number(effect.amount) || 0;
          $('preview-my-status').textContent = `Đòn kế tiếp +${previewBoost} sát thương`;
          showGain('preview-my-character', Number(effect.amount) || 0, 'SỨC MẠNH');
          notes.push('đòn kế tiếp được tăng sức mạnh');
          break;
        case 'weaken':
          previewWeak += Number(effect.amount) || 0;
          $('preview-opponent-status').textContent = `Đòn kế tiếp −${previewWeak} sát thương`;
          notes.push('đòn kế tiếp của đối thủ bị suy yếu');
          break;
        case 'cleanse':
          previewWeak = 0;
          $('preview-my-status').textContent = 'Đã xóa hiệu ứng xấu';
          notes.push('hiệu ứng xấu của bạn đã được xóa');
          break;
        case 'heal_and_damage': {
          const before = myHp;
          myHp = Math.min(10, myHp + (Number(effect.heal) || 0));
          const healed = myHp - before;
          renderHealth();
          showGain('preview-my-character', healed);
          if (healed) notes.push(`bạn hồi ${healed} máu`);
          break;
        }
      }
    }
    $('preview-log').textContent = `${card.emoji} ${card.name}: ${notes.join(' · ') || card.text}`;
    running = false;
    $('preview-again').disabled = false;
  }

  $('open-library').addEventListener('click', openLibrary);
  $('close-library').addEventListener('click', closeLibrary);
  $('preview-again').addEventListener('click', runPreview);
  $('preview-reset').addEventListener('click', resetBoard);
  modal.querySelectorAll('[data-close-library]').forEach((el) => el.addEventListener('click', closeLibrary));
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeLibrary(); });
  renderLibrary();
  renderHealth();
})();

