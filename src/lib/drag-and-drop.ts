// Taken from this demo: https://www.youtube.com/watch?v=lTDKhj83tec
// Added the ability to order cards, with drop position highlighting etc.

// Cards
export function draggable(node: HTMLElement, data: any) {
  if (!data.on_drag_start) return
  let state = data

  node.draggable = true
  node.style.cursor = 'grab'

  function handle_dragstart(e: DragEvent) {
    if (!e.dataTransfer) return
    e.dataTransfer.setData('text/plain', JSON.stringify(state))
    state.on_drag_start(state.card_id)
  }

  function handle_dragenter(e: DragEvent) {
    if (!(e.target instanceof HTMLElement)) return
    e.target.classList.add('droppable')
  }

  function handle_dragleave(e: DragEvent) {
    if (!(e.target instanceof HTMLElement)) return
    e.target.classList.remove('droppable')
  }

  node.addEventListener('dragstart', handle_dragstart)
  node.addEventListener('dragenter', handle_dragenter)
  node.addEventListener('dragleave', handle_dragleave)

  return {
    update(data: string) {
      state = data
    },

    destroy() {
      node.removeEventListener('dragstart', handle_dragstart)
      node.removeEventListener('dragenter', handle_dragenter)
      node.removeEventListener('dragleave', handle_dragleave)
    }
  }
}

// Columns
export function dropzone(node: HTMLElement, options: any) {
  let state = {
    dropEffect: 'move',
    dragover_class: 'droppable',
    ...options
  }

  function handle_dragenter(e: DragEvent) {
    if (!(e.target instanceof HTMLElement)) return
    if (e.target!.classList.contains('cards')) {
      const lastCard = [...e.target!.children][e.target!.children.length - 1]
      if (lastCard && lastCard.classList.contains('card')) {
        lastCard.classList.add('droppable-end')
        return
      } else {
        e.target.classList.add('droppable')
      }
    }
  }

  function handle_dragleave(e: DragEvent) {
    if (!(e.target instanceof HTMLElement)) return
    if (e.target!.classList.contains('cards')) {
      const lastCard = [...e.target!.children][e.target!.children.length - 1]
      if (lastCard && lastCard.classList.contains('card')) {
        lastCard.classList.remove('droppable-end')
      }
    }
    e.target.classList.remove(state.dragover_class)
  }

  function handle_dragover(e: DragEvent) {
    e.preventDefault()
    if (!e.dataTransfer) return
    e.dataTransfer.dropEffect = state.dropEffect
  }

  function handle_drop(e: DragEvent) {
    e.preventDefault()
    if (!e.dataTransfer) return
    const dropTarget = e.target as HTMLElement
    let targetPosition = -1
    if (dropTarget!.classList.contains('card')) {
      const index = [...dropTarget!.parentNode!.children].indexOf(dropTarget)
      const positionOfTarget = parseFloat(dropTarget.getAttribute('data-position') || '0')
      const itemBeforeTarget = [...dropTarget!.parentNode!.children][index - 1]
      let positionOfItemBeforeTarget = positionOfTarget - 1
      if (itemBeforeTarget) {
        positionOfItemBeforeTarget = parseFloat(itemBeforeTarget.getAttribute('data-position') || '0')
      }
      targetPosition = positionOfItemBeforeTarget + ((positionOfTarget - positionOfItemBeforeTarget) / 2)
    } else {
      let container
      if (dropTarget!.classList.contains('cards')) {
        container = dropTarget
      }
      if (container) {
        const lastCard = [...container!.children][container!.children.length - 1]
        if (lastCard && lastCard.classList.contains('card')) {
          const lastCardPosition = parseFloat(lastCard.getAttribute('data-position') || '0')
          targetPosition = lastCardPosition + 1
        } else {
          targetPosition = 1
        }
      } else {
        targetPosition = 1
      }
    }
    if (!(e.target instanceof HTMLElement)) return
    if (e.target!.classList.contains('cards')) {
      const lastCard = [...e.target!.children][e.target!.children.length - 1]
      if (lastCard && lastCard.classList.contains('card')) {
        lastCard.classList.remove('droppable-end')
      }
    }
    e.target.classList.remove(state.dragover_class)
    state.on_dropzone(state.column_id, targetPosition, e)
  }

  node.addEventListener('dragenter', handle_dragenter)
  node.addEventListener('dragleave', handle_dragleave)
  node.addEventListener('dragover', handle_dragover)
  node.addEventListener('drop', handle_drop)

  return {
    update(options: any) {
      state = {
        dropEffect: 'move',
        dragover_class: 'droppable',
        ...options
      }
    },

    destroy() {
      node.removeEventListener('dragenter', handle_dragenter)
      node.removeEventListener('dragleave', handle_dragleave)
      node.removeEventListener('dragover', handle_dragover)
      node.removeEventListener('drop', handle_drop)
    }
  }
}
