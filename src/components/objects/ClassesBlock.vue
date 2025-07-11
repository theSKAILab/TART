<!--defines a Vue.js component responsible for managing and displaying
   the list of classes (or tags)-->
   <template>
    <div class="q-pa-md" style="height: 90px; border-bottom: 1px solid #ccc;">
      <div class="row">
        <div class="tags">
          <q-chip
            v-for="(cl, index) in classes"
            :key="cl.id"
            outline
            square
            style="height: 2rem;"
            :color="cl.color.replace('11', '12')"
            clickable
            @click="setCurrentClass(index)"
            :removable="showDeleteButtons"
            @remove="handleRemoveClass(cl.id, cl.name)"
          >
            <q-avatar
              v-if="cl.id === currentClass.id"
              :color="cl.color.replace('11', '12')"
              style="height: 2rem"
              text-color="white"
              :icon="'fa fa-check'"
            ></q-avatar>
            <q-avatar
              v-if="cl.id !== currentClass.id"
              :color="cl.color.replace('11', '12')"
              style="height: 2rem"
              text-color="white"
              font-size="16px"
            >{{ index + 1 }}</q-avatar>
            <p :class="['q-mb-none', $q.dark.isActive ? 'text-grey-3' : 'text-grey-9']">{{ cl.name }}</p>
          </q-chip>
        </div>
        <q-space></q-space>
        <div class="q-mx-md">
          <q-input
            bottom-slots
            v-model="newClassName"
            v-if="showNewClassInput || classes.length === 0"
            hint="Enter a NER Tag and click [+] to add it"
            dense
            autofocus
          >
            <template v-slot:append>
              <q-btn
                round
                dense
                flat
                color="primary"
                icon="fa fa-plus"
                @click="saveNewClass"
              />
              <q-btn
                round
                color="negative"
                dense
                flat
                icon="fa fa-times"
                @click="showNewClassInput = false"
              />
            </template>
          </q-input>
        </div>
        <div class="buttons">
          <q-btn v-if="$store.state.currentPage !== 'review'"
            outline
            @click="showNewClassInput = true"
            label="New Tag"
            class="q-mr-sm"
            :color="$q.dark.isActive ? 'grey-3' : 'grey-9'"
          />
          <q-btn v-if="$store.state.currentPage !== 'review'"
            outline
            @click="showDeleteButtons = !showDeleteButtons"
            :label="showDeleteButtons ? 'Lock Tags' : 'Edit Tags'"
            :color="$q.dark.isActive ? 'grey-3' : 'grey-9'"
          />
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { mapState, mapMutations, mapActions } from "vuex";
  export default {
    name: "ClassesBlock",
    data() {
      return {
        showNewClassInput: false,
        newClassName: "",
        showDeleteButtons: false,
      };
    },
    computed: {
      ...mapState(["classes", "currentClass"]),
    },
    watch: {
      newClassName(now, then) {
        if (now != then) {
          this.newClassName = now.toUpperCase();
        }
      },
    },
    methods: {
      ...mapMutations(["setCurrentClass"]),
      ...mapActions(["createNewClass", "deleteClass"]),
      handleRemoveClass(class_id, className) {
        this.$q.dialog({
          title: 'Tag Removal Confirmation',
          message: 'Are you sure you want to remove the tag `' + className + '`?',
          cancel: true,
          persistent: true
        }).onOk(() => {
          this.deleteClass(class_id);
        })
      },
      saveNewClass() {
        if (!this.newClassName) {
          return;
        }
        const self = this;
        this.createNewClass(this.newClassName).then(() => {
          self.showNewClassInput = false;
          self.newClassName = "";
        });
      },
    },
  };
  </script>
  
  <style lang="css" scoped>
  .color-box {
    width: 1rem;
    height: 1rem;
    margin-right: 1rem;
  }
  </style>
  