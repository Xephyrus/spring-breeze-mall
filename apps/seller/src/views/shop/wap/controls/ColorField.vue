<template>
  <div class="ctrl-row">
    <div class="ctrl-label">{{ label }}</div>
    <div class="ctrl-body">
      <el-color-picker
        :model-value="modelValue"
        @update:model-value="onInput"
      />
      <el-input
        :model-value="modelValue"
        class="ctrl-color-input"
        placeholder="#FFFFFF"
        @update:model-value="onInput"
      />
      <el-button link type="primary" @click="onReset">重置</el-button>
    </div>
  </div>
</template>

<script setup>
defineOptions({ name: "ColorField" })

const props = defineProps({
  modelValue: { type: String, default: "" },
  defaultValue: { type: String, default: "" },
  label: { type: String, default: "" },
})

const emit = defineEmits(["update:modelValue"])

function onInput(val) {
  emit("update:modelValue", val)
}

function onReset() {
  emit("update:modelValue", props.defaultValue)
}
</script>

<style scoped lang="scss">
@import "./field-common.scss";
</style>
