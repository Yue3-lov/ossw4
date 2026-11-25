/**
 * 방명록 미니 웹 애플리케이션 (Guestbook Mini Web)
 * - 로컬 스토리지(localStorage) 기반 데이터 저장
 * - 외부 서버 및 DB 미사용
 */

// 로컬 스토리지 키 정의
const STORAGE_KEY = 'guestbook_entries';

// DOM 요소 참조
const form = document.getElementById('guestbook-form');
const nameInput = document.getElementById('name-input');
const messageInput = document.getElementById('message-input');
const charCounter = document.getElementById('char-counter');
const entriesList = document.getElementById('entries-list');
const emptyState = document.getElementById('empty-state');
const entryCountBadge = document.getElementById('entry-count');

/**
 * 로컬 스토리지에서 방명록 목록 가져오기
 * @returns {Array<{id: string, name: string, message: string, createdAt: string}>}
 */
function getEntries() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('로컬스토리지 데이터 로드 실패:', error);
    return [];
  }
}

/**
 * 로컬 스토리지에 방명록 목록 저장
 * @param {Array} entries
 */
function saveEntries(entries) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('로컬스토리지 저장 실패:', error);
    alert('데이터 저장 중 오류가 발생했습니다.');
  }
}

/**
 * 날짜 포맷팅 함수
 * @param {string} isoString
 * @returns {string}
 */
function formatDate(isoString) {
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

/**
 * 방명록 목록 화면 렌더링
 */
function renderEntries() {
  const entries = getEntries();

  // 개수 뱃지 업데이트
  entryCountBadge.textContent = `총 ${entries.length}개`;

  // 빈 상태 표시 제어
  if (entries.length === 0) {
    emptyState.style.display = 'block';
    entriesList.innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';
  entriesList.innerHTML = '';

  // XSS 방지를 위해 DOM 요소를 직접 생성하고 textContent 사용
  entries.forEach((entry) => {
    const li = document.createElement('li');
    li.className = 'entry-card';

    // 카드 상단 영역 (작성자 정보 + 삭제 버튼)
    const header = document.createElement('div');
    header.className = 'entry-header';

    const authorWrap = document.createElement('div');
    authorWrap.className = 'entry-author-wrap';

    const avatar = document.createElement('div');
    avatar.className = 'entry-avatar';
    avatar.textContent = entry.name ? entry.name.trim().charAt(0).toUpperCase() : '?';

    const infoWrap = document.createElement('div');
    const authorSpan = document.createElement('span');
    authorSpan.className = 'entry-author';
    authorSpan.textContent = entry.name;

    const dateSpan = document.createElement('div');
    dateSpan.className = 'entry-date';
    dateSpan.textContent = formatDate(entry.createdAt);

    infoWrap.appendChild(authorSpan);
    infoWrap.appendChild(dateSpan);
    authorWrap.appendChild(avatar);
    authorWrap.appendChild(infoWrap);

    // 삭제 버튼
    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'btn btn-delete';
    deleteBtn.textContent = '삭제';
    deleteBtn.setAttribute('data-id', entry.id);
    deleteBtn.setAttribute('title', '이 방명록 글 삭제');

    header.appendChild(authorWrap);
    header.appendChild(deleteBtn);

    // 메시지 본문
    const messageP = document.createElement('p');
    messageP.className = 'entry-message';
    messageP.textContent = entry.message;

    // 조립
    li.appendChild(header);
    li.appendChild(messageP);

    entriesList.appendChild(li);
  });
}

/**
 * 방명록 신규 등록 핸들러
 */
function handleSubmit(e) {
  e.preventDefault();

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name) {
    alert('이름을 입력해주세요.');
    nameInput.focus();
    return;
  }

  if (!message) {
    alert('메시지를 입력해주세요.');
    messageInput.focus();
    return;
  }

  const newEntry = {
    id: 'entry_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    name: name,
    message: message,
    createdAt: new Date().toISOString()
  };

  const entries = getEntries();
  entries.unshift(newEntry); // 최신 글이 맨 위에 위치하도록 추가
  saveEntries(entries);

  renderEntries();

  // 폼 초기화 및 포커스
  form.reset();
  updateCharCounter();
  nameInput.focus();
}

/**
 * 글 삭제 핸들러 (이벤트 위임)
 */
function handleDelete(e) {
  const target = e.target;
  if (!target.classList.contains('btn-delete')) return;

  const id = target.getAttribute('data-id');
  if (!id) return;

  const isConfirmed = confirm('정말 이 방명록 글을 삭제하시겠습니까?');
  if (!isConfirmed) return;

  let entries = getEntries();
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries(entries);

  renderEntries();
}

/**
 * 글자 수 카운터 업데이트
 */
function updateCharCounter() {
  const length = messageInput.value.length;
  charCounter.textContent = `${length} / 200자`;

  if (length >= 180) {
    charCounter.classList.add('limit-near');
  } else {
    charCounter.classList.remove('limit-near');
  }
}

// 이벤트 리스너 등록
form.addEventListener('submit', handleSubmit);
entriesList.addEventListener('click', handleDelete);
messageInput.addEventListener('input', updateCharCounter);

// 페이지 로드 시 초기 렌더링
document.addEventListener('DOMContentLoaded', () => {
  renderEntries();
  updateCharCounter();
});
