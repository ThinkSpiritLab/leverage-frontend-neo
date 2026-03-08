<template>
  <div>
    <h2 style="text-align: center; margin-bottom: 24px">登录</h2>
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="用户名" path="username">
        <NInput
          v-model:value="form.username"
          placeholder="请输入用户名"
          @keydown.enter="handleLogin"
        />
      </NFormItem>
      <NFormItem label="密码" path="password">
        <NInput
          v-model:value="form.password"
          type="password"
          show-password-on="click"
          placeholder="请输入密码"
          @keydown.enter="handleLogin"
        />
      </NFormItem>
    </NForm>

    <NAlert v-if="error" type="error" style="margin-bottom: 16px">
      {{ error }}
    </NAlert>

    <NButton
      type="primary"
      block
      :loading="loading"
      @click="handleLogin"
    >
      登录
    </NButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const authStore = useAuthStore()
const router = useRouter()

const formRef = ref()
const loading = ref(false)
const error = ref('')

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  error.value = ''
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  loading.value = true
  try {
    await authStore.login(form.username, form.password)
    router.push('/problems')
  }
  catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || '登录失败，请检查用户名和密码'
  }
  finally {
    loading.value = false
  }
}
</script>
