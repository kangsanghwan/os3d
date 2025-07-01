import '@/scss/main.scss';

(() => {
    document.addEventListener('DOMContentLoaded', () => {

        const accordions = document.querySelectorAll('.accordion');
    
        accordions.forEach(accordion => {
            const header = accordion.querySelector('.accordion__header');
            const arrow = accordion.querySelector('.accordion__arrow');
            
            if (header) {
                header.addEventListener('click', function(e) {
                    // 체크박스 클릭 시 아코디언 토글 방지
                    if (e.target.type === 'checkbox' || e.target.closest('.label-checkbox')) {
                        return;
                    }
                    
                    const isOpen = accordion.classList.contains('is-open');
                    
                    // 모든 아코디언 닫기
                    accordions.forEach(acc => {
                        acc.classList.remove('is-open');
                        const accArrow = acc.querySelector('.accordion__arrow');
                        if (accArrow) {
                            accArrow.setAttribute('aria-expanded', 'false');
                        }
                    });
                    
                    // 클릭된 아코디언 열기
                    if (!isOpen) {
                        accordion.classList.add('is-open');
                        if (arrow) {
                            arrow.setAttribute('aria-expanded', 'true');
                        }
                    }
                });
            }
        });
        
        const navList = document.querySelector('.nav__list');
        const closeBtns = document.querySelectorAll('.header__close-btn');
        const toggleBtn = document.querySelector('.panel__toggle');
        const panels = document.querySelectorAll('.viewer-app__panel');
        const contentItems = document.querySelectorAll('.panel--viewer__con__item');

        // helper functions
        const resetToggle = () => {
            if (!toggleBtn) return;
            toggleBtn.classList.remove('is-collapsed');
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.setAttribute('aria-label', '패널 닫기');
        };
        const updateToggle = () => {
            const active = document.querySelector('.viewer-app__panel.is-active');
            if (!toggleBtn) return;
            toggleBtn.classList.toggle('is-hidden', !active);
            toggleBtn.setAttribute('aria-hidden', String(!active));
        };
        const hidePanels = () => panels.forEach(p => p.classList.remove('is-active', 'is-collapsed'));
        const clearNav = () => document.querySelectorAll('.nav__item--active')
            .forEach(item => item.classList.remove('nav__item--active'));

        // 네비게이션 클릭 시 패널 전환
        navList?.addEventListener('click', e => {
            const link = e.target.closest('.nav__link');
            if (!link) return;
            e.preventDefault();
            const target = link.dataset.target;

            clearNav();
            link.parentElement.classList.add('nav__item--active');
            link.setAttribute('aria-current', 'page');

            hidePanels();
            document.querySelector(`.viewer-app__panel[data-panel="${target}"]`)?.classList.add('is-active');

            resetToggle();
            updateToggle();
        });

        // 닫기 버튼 클릭 시 패널 닫기
        closeBtns.forEach(btn => btn.addEventListener('click', e => {
            e.preventDefault();
            hidePanels();
            clearNav();
            resetToggle();
            updateToggle();
        }));

        // 공통 토글 버튼으로 패널 접기/펼치기
        toggleBtn?.addEventListener('click', e => {
            e.preventDefault();
            const active = document.querySelector('.viewer-app__panel.is-active');
            if (!active) return;
            const collapsed = active.classList.toggle('is-collapsed');
            toggleBtn.classList.toggle('is-collapsed', collapsed);
            toggleBtn.setAttribute('aria-expanded', String(!collapsed));
            toggleBtn.setAttribute('aria-label', collapsed ? '패널 열기' : '패널 닫기');
        });

        // 콘텐츠 아이템 클릭 시 해당 패널로 이동
        contentItems.forEach(item => {
            item.addEventListener('click', e => {
                e.preventDefault();
                const target = item.dataset.target;
                if (!target) return;

                // 네비게이션 상태 업데이트
                clearNav();
                document.querySelectorAll('.nav__link').forEach(link => {
                    if (link.dataset.target === target) {
                        link.parentElement.classList.add('nav__item--active');
                        link.setAttribute('aria-current', 'page');
                    }
                });

                // 패널 표시 전환
                hidePanels();
                document.querySelector(`.viewer-app__panel[data-panel="${target}"]`)?.classList.add('is-active');

                resetToggle();
                updateToggle();
            });
        });

        // 초기 토글 버튼 상태 설정
        updateToggle();
    });
})();

// 공통 탭
document.querySelectorAll('.tab-group').forEach(tabGroup => {
    const tabs = tabGroup.querySelectorAll('.tab-group__tab');
    // aria-controls로 연결된 패널만!  
    const panels = Array.from(tabs).map(tab =>
        document.getElementById(tab.getAttribute('aria-controls'))
    );

    function activateTab(idx, moveToPanelInput = true) {
        tabs.forEach((tab, i) => {
            tab.classList.toggle('tab-group__tab--selected', i === idx);
            tab.setAttribute('aria-selected', i === idx ? 'true' : 'false');
            tab.tabIndex = i === idx ? 0 : -1;
        });
        panels.forEach((panel, i) => {
            panel.hidden = i !== idx;
            if (i === idx && moveToPanelInput) {
                // 아래는 첫번째 폼 포커스(선택, input 등) 
                const focusable = panel.querySelector('select, input, textarea, button, [tabindex]:not([tabindex="-1"])');
                if (focusable) focusable.focus();
            }
        });
        tabs[idx].focus();
    }

    tabs.forEach((tab, idx) => {
        tab.addEventListener('click', () => activateTab(idx));
        tab.addEventListener('keydown', (e) => {
            let dir = 0;
            if (e.key === 'ArrowRight') dir = 1;
            else if (e.key === 'ArrowLeft') dir = -1;
            else if (e.key === 'Home') dir = -999;
            else if (e.key === 'End') dir = 999;
            else if (e.key === 'Enter' || e.key === ' ') {
                activateTab(idx, true);
                e.preventDefault();
                return;
            } else {
                return;
            }
            let nextIdx;
            if (dir === -999) nextIdx = 0;
            else if (dir === 999) nextIdx = tabs.length - 1;
            else nextIdx = (idx + dir + tabs.length) % tabs.length;
            activateTab(nextIdx, false);
            e.preventDefault();
        });
    });

    // 최초 활성 탭 세팅(첫 번째)
    activateTab(0, false);
});


// 카드 활성화
document.querySelectorAll('.observation-card').forEach(card => {
    const checkBtn = card.querySelector('.observation-card__check-btn');
    const content = card.querySelector('.observation-card__content');
    const radios = card.querySelectorAll('.observation-card__radio');
    let active = false; // 카드별 활성상태

    function updateState() {
        if (active) {
            card.classList.add('active');
            checkBtn.setAttribute('aria-pressed', 'true');
            radios.forEach(r => r.disabled = false);
            content.setAttribute('aria-hidden', 'false');
        } else {
            card.classList.remove('active');
            checkBtn.setAttribute('aria-pressed', 'false');
            radios.forEach(r => r.disabled = true);
            content.setAttribute('aria-hidden', 'true');
        }
    }

    // 최초 상태
    updateState();

    function toggleCardActive() {
        active = !active;
        updateState();
    }

    checkBtn.addEventListener('click', toggleCardActive);
    checkBtn.addEventListener('keydown', e => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            toggleCardActive();
        }
    });
});

///슬라이더
const sliders = document.querySelectorAll('.custom-slider');

function setSliderTrackAndValue(el) {
    const min = +el.min;
    const max = +el.max;
    const val = +el.value;
    const percent = ((val - min) / (max - min)) * 100;
    const grad = `linear-gradient(to right, #444 ${percent}%, #e6e6e6 ${percent}%)`;
    el.style.background = grad;
    // value 표기 업데이트
    const valueSpan = el.parentElement.querySelector('.slider-value');
    if (valueSpan) valueSpan.textContent = val;
}

sliders.forEach(slider => {
    setSliderTrackAndValue(slider); // 초기
    slider.addEventListener('input', () => setSliderTrackAndValue(slider));
});

const input = document.getElementById('fileInput1');
const fileList = document.getElementById('fileList1');

// 파일 리스트 랜더 함수
function renderFileList(files) {
    fileList.innerHTML = '';
    Array.from(files).forEach((file, idx) => {
        const li = document.createElement('li');
        li.className = 'step-filelist__item';

        // 파일명
        const nameSpan = document.createElement('span');
        nameSpan.className = 'step-filelist__name';
        nameSpan.textContent = file.name;

        // 삭제버튼
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'step-filelist__remove';
        removeBtn.setAttribute('aria-label', `파일 ${file.name} 삭제`);
        removeBtn.textContent = '×';

        removeBtn.addEventListener('click', () => {
            // 새 FileList 생성(삭제)
            const dt = new DataTransfer();
            Array.from(input.files).forEach((f, i) => { if (i !== idx) dt.items.add(f); });
            input.files = dt.files;
            renderFileList(input.files);
        });

        li.appendChild(nameSpan);
        li.appendChild(removeBtn);
        fileList.appendChild(li);
    });
}

// input에 change 이벤트
input.addEventListener('change', () => {
    renderFileList(input.files);
});
