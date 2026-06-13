const log = (...a) => console.log('%c[한영타-BG]', 'color:#3a7', ...a);
log('서비스 워커 시작됨');

function setupMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'convert-typo',
      title: '한영타 변환',
      contexts: ['all']
    }, () => {
      if (chrome.runtime.lastError) log('메뉴 생성 실패:', chrome.runtime.lastError.message);
      else log('메뉴 생성 성공');
    });
  });
}

chrome.runtime.onInstalled.addListener(() => { log('onInstalled'); setupMenu(); });
chrome.runtime.onStartup.addListener(() => { log('onStartup'); setupMenu(); });
setupMenu(); // 서비스워커가 깨어날 때마다 보장

chrome.contextMenus.onClicked.addListener((info, tab) => {
  log('메뉴 클릭됨:', info.menuItemId, '| 탭:', tab && tab.id);
  if (info.menuItemId === 'convert-typo' && tab && tab.id != null) {
    chrome.tabs.sendMessage(tab.id, { type: 'CONVERT_TYPO' }, (resp) => {
      if (chrome.runtime.lastError) log('content로 전송 실패:', chrome.runtime.lastError.message);
      else log('content 응답:', resp);
    });
  }
});
