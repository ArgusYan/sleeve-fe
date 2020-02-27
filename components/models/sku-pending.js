/**
 * @author: Argus
 * @description 拿到用户选择的规格值 并保存
 * @date 2020/2/25 13:56
 */
import { Joiner } from '../../utils/common'

class SkuPending {
  //用户每次选中规格值保存到pending数组 并且以行号作为数组index 1对1的查找 每行只能出现一个
  pending = []
  length
  currentPath = ''

  constructor (length) {
    this.length = length
  }

  judgePendingFull () {
    if (this.pending.length === 0) return false
    const flag = this.pending.every(item => {
      return item !== null && this.pending.length === this.length
    })
    console.log(flag)
    return flag
  }

  /**
   * 返回已选规格值的title 和 code
   */
  returnSelectedCellTitle () {
    const joiner = new Joiner('，')
    for (let element of this.pending) {
      if (element !== null) {
        joiner.join(element.title)
      }
    }
    return joiner.getStr()
  }

  /**
   * @param cell 当前选中的cell
   * @param x 当前行号
   */
  insertPending (cell, x) {
    this.pending[x] = cell
  }

  /**
   * 删除当前取消选中的cell
   * @param x
   */
  removeCell (x) {
    this.pending[x] = null
  }

  /**
   * 根据索引即对应的行号返回cell
   * @param x
   * @returns {cell | undefined} 返回用户选中的cell
   */
  findCellByRowNum (x) {
    return this.pending[x]
  }

  /**
   * 查找当前的cell和已选cell是否一致
   * @param x
   */
  judgeCellSelectedEqualsCurrentCell (cell, x) {
    const cell_selected = this.findCellByRowNum(x)
    if (cell_selected) {
      //  存在并且value_id一致
      return cell_selected.id === cell.id
    }
  }
}

export {
  SkuPending
}