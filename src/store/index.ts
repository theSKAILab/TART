import { AnnotationManager } from '../components/classes/AnnotationManager.ts'
import { TMTokenBlock } from '../components/classes/tokenmanager.ts'
import { LabelManager } from '../components/classes/LabelManager.ts'

const mutations = {
  setCurrentPage(state, page) {
    state.currentPage = page
  },
  processFile(state, payload) {
    // Clear Out Data
    // TODO: LIKELY DELETE THESE AS THEY MOVE TO CLASSES
    state.undoStack = []

    if (state.fileName.split('.')[1] == 'json') {
      // Loading a JSON file
      state.annotationManager = AnnotationManager.fromJSON(payload)
    } else {
      // Loading a text file
      state.annotationManager = AnnotationManager.fromText(payload)
    }

    const classesJSON: object = JSON.parse(payload)

    if (classesJSON.classes && Array.isArray(classesJSON.classes)) {
      state.labelManager = LabelManager.fromJSON(classesJSON.classes)
    } else {
      state.labelManager = new LabelManager()
    }
  },

  // Navigation
  nextSentence(state) {
    if (state.currentIndex < state.annotationManager.inputSentences.length - 1) {
      state.currentIndex += 1
    }
  },
  previousSentence(state) {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1
    }
  },
  resetIndex(state) {
    state.currentIndex = 0
  },

  // Global Undo Stack
  addUndoCreate(state, block) {
    const newUndo = {
      type: 'remove',
      start: block.start,
    }
    state.undoStack.push(newUndo)
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp)
  },
  addUndoDelete(state, removedBlock: TMTokenBlock) {
    const newUndo = {
      type: 'create',
      oldBlock: removedBlock,
    }
    state.undoStack.push(newUndo)
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp)
  },
  addUndoUpdate(state, oldBlock: TMTokenBlock) {
    // on action side, deletes block and adds back old block in place
    // differs from delete in that it expects no blocks to be there
    const newUndo = {
      type: 'update',
      oldBlock: oldBlock,
    }
    state.undoStack.push(newUndo)
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp)
  },
  addUndoOverlapping(state, { oldBlocks, newBlockStart }) {
    const newUndo = {
      type: 'overlapping',
      overlappingBlocks: oldBlocks,
      newBlockStart: newBlockStart,
    }
    state.undoStack.push(newUndo)
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp)
  },
  loadFile(state, file) {
    state.fileName = file.name
    const fileType = file.name.split('.').pop()
    try {
      const reader = new FileReader()
      reader.readAsText(file)
      reader.addEventListener('load', (event) => {
        mutations.processFile(state, event.target.result)

        if (fileType === 'txt') {
          mutations.setCurrentPage(state, 'annotate')
        } else if (fileType === 'json') {
          mutations.setCurrentPage(state, 'review')
        } else {
          this.$q.dialog({
            title: 'Incompatible File Type',
            message: 'Please upload either a .txt or a .json file.',
          })
          mutations.setCurrentPage(state, 'start')
        }
      })
    } catch (e) {
      this.$q.notify({
        icon: 'fas fa-exclamation-circle',
        message: 'Invalid file',
        color: 'red-6',
        position: 'top',
        timeout: 2000,
        actions: [{ label: 'Dismiss', color: 'white' }],
      })
    }
  },
}

export default {
  state() {
    return {
      currentIndex: 0,
      currentPage: 'start',
      fileName: null,
      undoStack: [],
      annotationManager: null, // Global annotation manager
      labelManager: null, // Global label manager
    }
  },
  mutations,
}
