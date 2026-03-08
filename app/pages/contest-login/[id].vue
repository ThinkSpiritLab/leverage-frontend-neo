<template>
  <div>
    <NH2 style="text-align: center; margin-bottom: 8px">竞赛专属登录</NH2>
    <p style="text-align: center; color: #666; margin-bottom: 20px">
      请使用竞赛账号登录以访问竞赛内容
    </p>

    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="用户名" path="username">
        <NInput
          v-model:value="form.username"
          placeholder="请输入竞赛用户名"
          :disabled="loading"
          @keydown.enter="handleLogin"
        />
      </NFormItem>
      <NFormItem label="竞赛密码" path="password">
        <NInput
          v-model:value="form.password"
          type="password"
          show-password-on="click"
          placeholder="请输入竞赛密码"
          :disabled="loading"
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
      登录竞赛
    </NButton>

    <div style="text-align: center; margin-top: 12px">
      <NButton text type="primary" @click="navigateTo(`/contests/${contestId}`)">
        返回竞赛页面
      </NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const route = useRoute()
const contestId = computed(() => Number(route.params.id))
const authApi = useAuthApi()

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
    const res = await authApi.loginContest(contestId.value, form.username, form.password)
    const data = res.data ?? res
    const token = data.accessToken ?? data
    // 存储竞赛专属 token
    localStorage.setItem(`contestToken_${contestId.value}`, token)
    navigateTo(`/contests/${contestId.value}`)
  }
  catch (e: any) {
    error.value = e?.response?.data?.message || '竞赛账号或密码错误，请重试'
  }
  finally {
    loading.value = false
  }
}
</script>
