<template>
  <div>
    <classes-block />
    <div class="q-pa-lg" style="height: calc(100vh - 190px); overflow-y: scroll">
      <component
        :is="t.type === 'token' ? 'Token' : 'TokenBlock'"
        v-for="t in tm.tokens"
        :key="`${t.type}-${t.start}`"
        :token="t"
        :class="[t.reviewed ? 'user-active' : 'user-inactive']"
        :history="t.history"
        @remove-block="onRemoveBlock"
        v-model:currentState="t.currentState"
        v-model:labelClass="t.labelClass"
        v-model:reviewed="t.reviewed"
      />
    </div>
    <info-bar />
  </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex'
import Token from '../objects/Token'
import TokenBlock from '../objects/TokenBlock'
import ClassesBlock from '../objects/ClassesBlock.vue'
import InfoBar from '../toolbars/InfoBar.vue'
import SharedEditorFunctions from './shared.vue'

export default {
  name: 'AnnotationPage',
  components: {
    Token,
    TokenBlock,
    ClassesBlock,
    InfoBar,
  },
  computed: {
    ...mapState(['currentIndex', 'inputSentences', 'undoStack']),
  },
  watch: {
    inputSentences() {
      this.resetIndex()
      this.tokenizeCurrentSentence()
    },
  },
  created() {
    // Add blocks for all paragraphs
    if (this.inputSentences.length) {
      this.tokenizeCurrentSentence()
    }
    document.addEventListener('mouseup', this.selectTokens)
    window.onbeforeunload = this.beforeLeave

    // Emits
    this.emitter.on('undo', this.undo)
    this.emitter.on('undoAll', this.undoAll)
    this.emitter.on('tokenizeCurrentSentence', this.tokenizeCurrentSentence)
  },
  beforeUnmount() {
    document.removeEventListener('mouseup', this.selectTokens)

    // Remove emits
    this.emitter.off('undo', this.undo)
    this.emitter.off('undoAll', this.undoAll)
    this.emitter.off('tokenizeCurrentSentence', this.tokenizeCurrentSentence)
  },
  mixins: [SharedEditorFunctions],
  methods: {
    ...mapMutations(['resetIndex']),
  },
}
</script>
