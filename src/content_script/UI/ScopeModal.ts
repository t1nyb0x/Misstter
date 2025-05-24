import browser from 'webextension-polyfill'

import {
    public_scope_icon,
    home_scope_icon,
    lock_scope_icon,
    modal_pin_icon,
} from './Icons'
import { htmlFragment } from '../utils/htmlFragment'

export type Scope = 'public' | 'home' | 'followers'

const createScopeModal = (callback: (scope: Scope) => void) => {
    const modal = document.createElement('div')
    modal.style.fontFamily = 'sans-serif'
    modal.style.position = 'absolute'
    modal.style.width = '200px'
    modal.style.minWidth = '200px'
    modal.style.top = '45px'
    modal.style.backgroundColor = 'white'
    modal.style.borderRadius = '10px'
    modal.style.boxShadow =
        'rgba(101, 119, 134, 0.2) 0px 0px 15px, rgba(101, 119, 134, 0.15) 0px 0px 3px 1px'
    // transition on opacity
    modal.style.transition = 'opacity 0.2s ease 0s'

    // place pin at top center
    const modal_pin = document.createElement('div')
    modal_pin.appendChild(htmlFragment(modal_pin_icon))
    modal_pin.style.fill = 'white'
    modal_pin.style.width = '24px'
    modal_pin.style.height = '24px'
    modal_pin.style.position = 'absolute'
    modal_pin.style.top = '-12px'
    modal_pin.style.left = 'calc(50% - 12px)'
    modal.appendChild(modal_pin)

    const modal_content = document.createElement('div')
    const style = document.createElement('style')
    style.textContent = `
    .misskey_access_scope {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .misskey_access_scope h5 {
      margin: 0;
      padding: 8px;
      padding-left: 16px;
      font-size: 14px;
      font-weight: bold;
      border-bottom: 1px solid rgb(230, 236, 240);
    }

    .misskey_access_scope li {
      display: flex;
      align-items: center;
      padding: 8px;
      cursor: pointer;
      transition: background-color 0.1s ease 0s;
    }

    .misskey_access_scope li:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }

    .misskey_access_scope li span {
      font-size: 14px;
      margin-left: 8px;
      color: rgb(101, 119, 134);
    }

    .misskey_access_scope li[selcted] span {
      font-weight: bold;
      color: rgb(134, 179, 0);
    }

    .misskey_access_scope li svg {
      fill: rgb(101, 119, 134);
      width: 24px;
      height: 24px;
    }

    .misskey_access_scope li[selcted] svg {
      fill: rgb(134, 179, 0);
    }
      `
    modal_content.appendChild(style)
    // ul
    const ul = document.createElement('ul')
    ul.className = 'misskey_access_scope'
    modal_content.appendChild(ul)

    // 見出し
    const h5 = document.createElement('h5')
    h5.textContent = '公開範囲'
    const misskeySpan = document.createElement('span')
    misskeySpan.textContent = ' (Misskey) '
    misskeySpan.style.fontSize = '12px'
    misskeySpan.style.color = 'rgb(101, 119, 134)'
    h5.appendChild(misskeySpan)
    ul.appendChild(h5)

    // li
    type Item = { icon: string; label: string; scope: Scope }
    const items: Item[] = [
        { icon: public_scope_icon, label: 'パブリック', scope: 'public' },
        { icon: home_scope_icon, label: 'ホーム', scope: 'home' },
        { icon: lock_scope_icon, label: 'フォロワー', scope: 'followers' },
    ]
    items.forEach((item, index) => {
        const li = document.createElement('li')
        li.appendChild(htmlFragment(item.icon))

        const span = document.createElement('span')
        span.textContent = item.label
        li.appendChild(span)

        li.addEventListener('click', () => {
            setModalSelection(index)
            callback(item.scope)
        })

        ul.appendChild(li)
    })

    const liElements = Array.from(modal_content.querySelectorAll('ul li'))

    liElements.forEach((li, i) => {
        li.addEventListener('click', () => {
            setModalSelection(i)
            if (i === 0) {
                callback('public')
            } else if (i === 1) {
                callback('home')
            } else if (i === 2) {
                callback('followers')
            }
        })
    })

    const setModalSelection = (index: number) => {
        liElements.forEach((li, i) => {
            if (i === index) {
                li.attributes.setNamedItem(document.createAttribute('selcted'))
            } else if (li.attributes.getNamedItem('selcted')) {
                li.attributes.removeNamedItem('selcted')
            }
        })
    }

    const updateSelection = () =>
        browser.storage.sync.get(['misskey_scope']).then((result) => {
            const scope = result?.misskey_scope ?? 'public'
            if (scope === 'public') {
                setModalSelection(0)
            } else if (scope === 'home') {
                setModalSelection(1)
            } else if (scope === 'followers') {
                setModalSelection(2)
            }
        })

    const checkID = setInterval(() => {
        try {
            updateSelection()
        } catch (e) {
            clearInterval(checkID)
        }
    }, 2000)
    updateSelection()

    modal.appendChild(modal_content)
    return modal
}

const scopeModelHandler = (scope: Scope) => {
    browser.storage.sync.set({ misskey_scope: scope })
    document.querySelectorAll('.misskey-scope-button').forEach((button) => {
        updateScopeButton(button as HTMLDivElement, scope)
    })
}

// Global scope modal
const scopeModel = createScopeModal(scopeModelHandler)

export const showScopeModal = (scopeButton: HTMLDivElement) => {
    if (!isShowingScopeModal()) {
        document.body.appendChild(scopeModel)
    }

    // set position of modal
    const rect = scopeButton.getBoundingClientRect()
    scopeModel.style.top = `${rect.top + window.scrollY + 40}px`
    scopeModel.style.left = `${rect.left + window.scrollX - 83}px`
}

export const isShowingScopeModal = () => {
    return document.body.contains(scopeModel)
}

const handleDocumentClick = (e: MouseEvent) => {
    let target: any = e.target
    while (target) {
        if (target.className === 'misskey-scope-button') return
        target = target.parentNode
    }
    closeScopeModal()
}

window.addEventListener('click', handleDocumentClick)

export const closeScopeModal = () => {
    if (!isShowingScopeModal()) return

    // animation
    scopeModel.style.opacity = '0'
    setTimeout(() => {
        scopeModel.style.opacity = '1'
        // remove modal
        scopeModel.remove()
    }, 200)
}

export const updateScopeButton = (
    scopeButton: HTMLDivElement,
    scope: Scope
) => {
    const icon =
        scope === 'public'
            ? public_scope_icon
            : scope === 'home'
            ? home_scope_icon
            : lock_scope_icon

    if (scopeButton.firstChild) scopeButton.firstChild.remove()

    scopeButton.appendChild(htmlFragment(icon))
    ;(scopeButton.firstChild as HTMLElement).style.fill = 'rgb(134, 179, 0)'
}
