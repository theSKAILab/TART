import { LocalStorage } from "quasar";

const niceColors = ["red-11", "blue-11", "light-green-11", "deep-orange-11", "pink-11", "light-blue-11", "lime-11", "brown-11", "purple-11", "cyan-11", "yellow-11", "grey-11", "deep-purple-11", "teal-11", "amber-11", "blue-grey-11", "indigo-11", "green-11", "orange-11"];

const mutations = {
  setCurrentPage(state, page) {
    state.currentPage = page;
  },
  loadClasses(state, payload) {
    if (!Array.isArray(payload)) {
      throw new Error("loadClasses: payload must be an array");
    }
    let isValid = payload.reduce((acc, curr) => acc && typeof curr === "object" && "id" in curr && "name" in curr && "color" in curr, true);
    if (!isValid) {
      throw new Error("loadClasses: payload has invalid schema");
    }
    state.classes = payload;
    state.currentClass = state.classes[0];
    LocalStorage.set("tags", state.classes);
  },
  processFile(state, payload) {
    // Clear Out Data
    state.annotations = [];
    state.currentAnnotation = {};
    state.classes = [];
    state.currentClass = null;
    state.undoStack = [];

    var file = payload;
    if (state.fileName.split(".")[1] == "json") {
      file = JSON.parse(file);
      file.annotations = file.annotations.map((item) => {
        return [
          item[1],
          item[2]
        ]
      })
      // Strip paragraph ID from the file
    } else {
      // This forces the text file into the annotation file format, thus allowing it to be loaded the same without special edge cases
      file = file.replace(/(\r\n|\n|\r){2,}/gm, "\n");
      file = file.split(state.separator);
      file = file.map((item) => {
        return [
          item,
          {
            entities: []
          }
        ]
      })
      file = {
        annotations: file,
        classes: {}
      }
    }

    // Process Entities in Rich Entity Format (REF) used in this software
    // Additionally, stores the original state of the sentence annotations
    // This is useful for "undo all", but may eventually be replace with recursive execution of undo stack
    for(var i = 0; i < file.annotations.length; i++) {
      for (var j = 0; j < file.annotations[i][1].entities.length; j++) {
        var sentenceOriginalState = []
        var entity = file.annotations[i][1].entities[j];
        if (entity.length >= 3) {
            
            const thisAnnotationHistory = entity[3]
            const latestEntry = thisAnnotationHistory[thisAnnotationHistory.length - 1];

            const historyEntry = {
              start: entity[1],
              end: entity[2],
              history: thisAnnotationHistory,
              currentState: latestEntry[1],
              name: latestEntry[3],
              labelClass: {name: latestEntry[0]},
            }
           
            sentenceOriginalState.push(historyEntry);

            // Replace the entity with the history entry
            file.annotations[i][1].entities[j] = historyEntry;
          }
      
        if (file.annotations[i][1].entities.length) state.annotationHistory[i] = sentenceOriginalState;
        }
    }

    state.originalText = file.annotations.map((item) => item[0]).join(state.separator);
    state.inputSentences = state.originalText.split(state.separator).map((s, i) => ({ id: i, text: s }));
    state.annotations = file.annotations.map((sentence) => {
      return {
        text: sentence[0],
        entities: sentence[1].entities,
      }
    })

    if (file.classes && Array.isArray(file.classes)) {
       mutations.loadClasses(state, file.classes);
    }
  },
  //TODO: REPLACE COMMIT CALLS WITH THIS MUTATION
  addClass(state, payload) {
    // Check if the class already exists
    const existingClass = state.classes.find((c) => c.name === payload);

    // If the class already exists, return
    if (existingClass) {
      return;
    }

    // Add the new class
    const lastIndex = state.classes.reduce((p, c) => (c.id > p ? c.id : p), 0);
    const newClass = {
      id: lastIndex + 1,
      name: payload,
      color: niceColors[lastIndex % niceColors.length],
    };

    // Check again to handle a race condition
    if (!state.classes.some((c) => c.name === newClass.name)) {
      state.classes = [...state.classes, newClass];

      // If this is the first class, set it as the currentClass
      if (state.classes.length === 1) {
        state.currentClass = state.classes[0];
      }
    }
  },
  removeClass(state, payload) {
    state.classes = state.classes.filter((c) => c.id != payload);
    if (state.currentClass && state.currentClass.id === payload) {
      state.currentClass = state.classes[0];
    }
  },
  setCurrentClass(state, payload) {
    state.currentClass = state.classes[payload];
  },
  addAnnotation(state, payload) {
    state.annotations[state.currentIndex] = payload;
    state.currentAnnotation = payload;
  },
  clearAllAnnotations(state) {
    state.annotations = [];
    state.currentAnnotation = {};
  },
  nextSentence(state) {
    if (state.currentIndex < state.inputSentences.length - 1) {
      state.currentIndex += 1;
      state.currentAnnotation = state.annotations[state.currentIndex] || {};
    }
  },
  previousSentence(state) {
    if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      state.currentAnnotation = state.annotations[state.currentIndex];
    }
  },
  resetIndex(state) {
    state.currentIndex = 0;
  },
  // Global Undo Stack
  addUndoCreate(state, block) {
    var newUndo = {
      type: "remove",
      start: block.start,
    }
    state.undoStack.push(newUndo);
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp);
  },
  addUndoDelete(state, removedBlock) {
    var newUndo = {
      type: "create",
      oldBlock: removedBlock,
    };
    state.undoStack.push(newUndo);
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp);
  },
  addUndoUpdate(state, oldBlock) {
    // on action side, deletes block and adds back old block in place
    // differs from delete in that it expects no blocks to be there
    var newUndo = {
      type: "update",
      oldBlock: oldBlock
    };
    state.undoStack.push(newUndo);
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp);
  },
  addUndoOverlapping(state, {oldBlocks, newBlockStart}) {
    var newUndo = {
      type: "overlapping",
      overlappingBlocks: oldBlocks,
      newBlockStart: newBlockStart,
    }
    state.undoStack.push(newUndo);
    state.undoStack.sort((a, b) => b.timestamp - a.timestamp);
  },
  loadFile(state, file) {
    // onFileSelected() is called if the user clicks and manually
    //    selects a file. If they drag and drop, that is handled in
    //    App.vue. If you modify this function, you may also want to
    //    modify App#onDrop(), App#processFileDrop(), and
    //    LoadTextFile#onFileSelected() to match
    state.fileName = file.name;
    let fileType = file.name.split('.').pop();
    state.lastSavedTimestamp = null;
    try {
      let reader = new FileReader();
      reader.readAsText(file);
      reader.addEventListener("load", (event) => {
        mutations.processFile(state, event.target.result);

        if (fileType === "txt") {
          mutations.setCurrentPage(state, 'annotate');
        }
        else if (fileType === "json") {
          mutations.setCurrentPage(state, 'review');
        }
        else {
          this.$q.dialog({
            title: 'Incompatible File Type',
            message: 'Please upload either a .txt or a .json file.'
          })
          mutations.setCurrentPage(state, 'start')
        }
      });
    } catch (e) {
      this.$q.notify({
        icon: "fas fa-exclamation-circle",
        message: "Invalid file",
        color: "red-6",
        position: "top",
        timeout: 2000,
        actions: [{label: "Dismiss", color: "white"}],
      });
    }
  }
};

const actions = {
  createNewClass({ commit, state }, className) {
    return new Promise((resolve, reject) => {
      commit("addClass", className);
      try {
        LocalStorage.set("tags", state.classes);
      } catch (e) {
        reject(e);
      }
      resolve();
    });
  },
  deleteClass({ commit, state }, classId) {
    commit("removeClass", classId);
    LocalStorage.set("tags", state.classes);
  },
};

export default {
  state() {
    let tags = LocalStorage.getItem("tags");
    return {
      annotationHistory: {},
      annotationPrecision: "word",
      annotations: [],
      classes: tags || [],
      currentAnnotation: {},
      currentClass: (tags && tags[0]) || {},
      currentIndex: 0,
      currentPage: "start",
      currentSentence: "",
      fileName: null,
      inputSentences: [],
      lastSavedTimestamp: null,
      originalText: "",
      rejectedAnnotations: [],
      separator: "\n",
      undoStack: [],
    };
  },
  mutations,
  actions,
};
