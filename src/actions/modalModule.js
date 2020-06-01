export const SET_MODAL_VISIBLE = 'www/modal/SET_MODAL_VISIBLE'
export const HIDE_MODAL = 'www/modal/HIDE_MODAL'

export function setModalVisible(modalId) {
    return { type: SET_MODAL_VISIBLE, data: modalId }
}

export function hideModal() {
    return { type: HIDE_MODAL }
}
