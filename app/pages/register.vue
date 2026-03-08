<template>
  <div>
    <NForm ref="formRef" :model="form" :rules="rules" label-placement="top">
      <NFormItem label="用户名" path="username">
        <NInput v-model:value="form.username" placeholder="请输入用户名" :disabled="loading" />
      </NFormItem>
      <NFormItem label="密码" path="password">
        <NInput v-model:value="form.password" type="password" show-password-on="click" placeholder="请输入密码" :disabled="loading" />
      </NFormItem>
      <NFormItem label="确认密码" path="confirmPassword">
        <NInput v-model:value="form.confirmPassword" type="password" show-password-on="click" placeholder="请再次输入密码" :disabled="loading" />
      </NFormItem>
      <NFormItem label="真实姓名（可选）" path="certifiedName">
        <NInput v-model:value="form.certifiedName" placeholder="请输入真实姓名" :disabled="loading" />
      </NFormItem>
      <NFormItem label="邮箱（可选）" path="email">
        <NInput v-model:value="form.email" placeholder="请输入邮箱" :disabled="loading" />
      </NFormItem>
    </NForm>

    <NAlert v-if="error" type="error" style="margin-bottom: 16px">{{ error }}</NAlert>
    <NAlert v-if="success" type="success" style="margin-bottom: 16px">{{ success }}</NAlert>

    <NButton type="primary" block :loading="loading" @click="handleRegister">注册</NButton>
    <NButton block quaternary style="margin-top: 10px" @click="navigateTo('/login')">返回登录</NButton>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'auth' })

const authApi = useAuthApi()
const formRef = ref()
const loading = ref(false)
const error = ref('')
const success = ref('')

const form = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  certifiedName: '',
  email: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }, { min: 6, message: '密码至少 6 位', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_: any, value: string) => value === form.password,
      message: '两次密码不一致',
      trigger: ['input', 'blur'],
    },
  ],
}

async function handleRegister() {
  error.value = ''
  success.value = ''
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }

  loading.value = true
  try {
    await authApi.register({
      username: form.username.trim(),
      password: form.password,
      certifiedName: form.certifiedName.trim() || undefined,
      email: form.email.trim() || undefined,
    })
    success.value = '注册成功，请登录'
    setTimeout(() => navigateTo('/login'), 600)
  }
  catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || '注册失败，请重试'
  }
  finally {
    loading.value = false
  }
}

useHead({ title: '注册 — Leverage OJ' })
</script>
