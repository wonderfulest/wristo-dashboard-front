export const validateGiftTarget = (targetType, grantMethod, appId, bundleId, activationCode) => {
  if (targetType === 'APP' && grantMethod === 'ACTIVATION_CODE') {
    return /^\d{6}$/.test((activationCode || '').trim()) ? null : '请输入六位数字激活码'
  }
  if (targetType === 'APP' && !appId) return '请选择应用 ID'
  if (targetType === 'BUNDLE' && !bundleId) return '请选择 Bundle'
  return null
}

export const buildGiftTargetPayload = (targetType, grantMethod, appId, bundleId, activationCode) => {
  const activationCodeMode = targetType === 'APP' && grantMethod === 'ACTIVATION_CODE'
  return {
    appId: targetType === 'APP' && !activationCodeMode ? appId : null,
    bundleId: targetType === 'BUNDLE' ? bundleId : null,
    activationCode: activationCodeMode ? (activationCode || '').trim() : null,
  }
}
