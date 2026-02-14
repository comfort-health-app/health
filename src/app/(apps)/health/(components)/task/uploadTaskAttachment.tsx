import {basePath} from '@cm/lib/methods/common'

// ファイルアップロード
export const uploadTaskAttachment = async ({taskId, file}: {taskId: number; file: File}) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('taskId', taskId.toString())

    const response = await fetch(`${basePath}/health/api/task/${taskId}/attachment`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.error || `HTTPエラー: ${response.status} ${response.statusText}`,
      }
    }

    const result = await response.json()
    return {success: true, data: result.data}
  } catch (error) {
    console.error('ファイルアップロードエラー:', error)
    return {success: false, error: 'ファイルのアップロードに失敗しました'}
  }
}
