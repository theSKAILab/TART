<template>
    <div class="q-pa-md" style="">
        <div style="display: inline-block;">
            <span class="q-pl-md">{{ getWordCount(this.inputSentences[this.currentIndex].text) }} Words</span>
            <span class="q-pl-md">{{ getCharCount(this.inputSentences[this.currentIndex].text) }} Characters</span>
            <span class="q-pl-md">Paragraph {{ this.currentIndex + 1 }}/{{ this.REFFile.annotations.length }}</span>
            <span class="q-pl-md" v-if="this.REFFile.annotations[this.currentIndex].entities.length > 0">{{ this.REFFile.annotations[currentIndex].entities.length }} Annotations</span>
        </div>
        <q-btn class="q-mx-sm" :color="$q.dark.isActive ? 'grey-3' : 'grey-9'" outline title="Go back one sentence/paragraph" @click="back" :disabled="currentIndex == 0" label="Back" style="position: absolute; right: 95px; bottom: 17px;"/>
        <q-btn class="q-mx-sm" :color="$q.dark.isActive ? 'grey-3' : 'grey-9'" outline title="Go forward one sentence/paragraph" @click="next" :disabled="currentIndex == this.inputSentences.length - 1" label="Next" style="position: absolute; right: 16px; bottom: 17px;"/>
    </div>
</template>

<script>
import { mapState, mapMutations } from "vuex";

export default {
    name: "InfoBar",
    computed: {
        ...mapState(["currentIndex","inputSentences","REFFile"]),
    },
    methods: {
        ...mapMutations(["setCurrentIndex", "setCurrentPage","nextSentence","previousSentence"]),
        getWordCount(text) {
            if (text == null) return 0;
            let words = text.split(/\s+/).filter((word) => word.length > 0);
            return words.length;
            },
        getCharCount(text) {
            if (text == null) return 0;
            return text.length;
        },
        next() {
            this.nextSentence();
            this.emitter.emit("tokenizeCurrentSentence");
        },
        back() {
            this.previousSentence()
            this.emitter.emit("tokenizeCurrentSentence");
        },
    }
}
</script>