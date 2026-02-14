'use server'
import {Days} from '@cm/class/Days/Days'

import {GoogleCalendar_Get} from '@app/api/google/actions/calendarAPI'
import {roleIs} from 'src/non-common/scope-lib/judgeIsAdmin'
import {formatDate} from '@cm/class/Days/date-utils/formatters'
import {DateInput} from '@cm/class/Days/date-utils/date-utils-type'

// カレンダーイベントの型定義
export type CalendarEvent = {
  id: string
  summary: string // タイトル
  description?: string // 説明
  start: Date
  end: Date
  isHospitalRelated: boolean // 「病院」を含むかどうか
  htmlLink?: string // Googleカレンダーへのリンク
  calendarId: string // カレンダーID（アカウント識別用）
}

// カレンダーID定数
const CALENDAR_ID_1 = 'sinsyaoku@gmail.com' // ピンク色
const CALENDAR_ID_2 = 'sinsyaoku0501@gmail.com' // オレンジ色

// デフォルトのカレンダーID
const DEFAULT_CALENDAR_ID = CALENDAR_ID_1

// 「病院」関連かどうかを判定
function isHospitalRelated(summary?: string | null, description?: string | null): boolean {
  const text = `${summary || ''} ${description || ''}`
  return text.includes('病院')
}

// Googleカレンダーから予定を取得
export async function getCalendarEvents(params: {
  calendarId?: string
  from: Date
  to: Date
}): Promise<{success: boolean; data?: CalendarEvent[]; error?: string}> {
  try {
    const calendarId = params.calendarId || DEFAULT_CALENDAR_ID

    const response = await GoogleCalendar_Get({
      calendarId,
      from: params.from,
      to: params.to,
    })

    const items = response.events.items || []

    const hiddenEvents: string[] = []

    const events: CalendarEvent[] = items
      .filter(event => {
        const isCancelled = event.status === 'cancelled'

        return !isCancelled
      })
      .map(event => {
        // 終日イベントの場合は date、それ以外は dateTime
        const startDate = event.start?.dateTime || event.start?.date
        const endDate = event.end?.dateTime || event.end?.date

        return {
          id: event.id || '',
          summary: event.summary || '(無題)',
          description: event.description || undefined,
          start: new Date(startDate || new Date()),
          end: new Date(endDate || new Date()),
          isHospitalRelated: isHospitalRelated(event.summary, event.description),
          htmlLink: event.htmlLink || undefined,
          calendarId: calendarId,
        }
      })

    return {success: true, data: events}
  } catch (error) {
    console.error('Googleカレンダー取得エラー:', error)
    return {success: false, error: 'カレンダーの取得に失敗しました'}
  }
}

// 指定月のカレンダーイベントを取得
export async function getMonthCalendarEvents(params: {
  year: number
  month: number
  calendarId?: string
}): Promise<{success: boolean; data?: CalendarEvent[]; error?: string}> {
  const {year, month, calendarId} = params

  // 月の開始日と終了日を計算
  const from = new Date(year, month - 1, 1, 0, 0, 0)
  const to = new Date(year, month, 0, 23, 59, 59)

  return getCalendarEvents({calendarId, from, to})
}

// 指定日のカレンダーイベントを取得
export async function getDayCalendarEvents(params: {
  date: Date
  calendarId?: string
}): Promise<{success: boolean; data?: CalendarEvent[]; error?: string}> {
  const {date, calendarId} = params

  const from = new Date(date)
  from.setHours(0, 0, 0, 0)

  const to = new Date(date)
  to.setHours(23, 59, 59, 999)

  return getCalendarEvents({calendarId, from, to})
}

// 2つのアカウントから月のカレンダーイベントを取得
export async function getMonthCalendarEventsFromMultipleAccounts(params: {
  year: number
  month: number
}): Promise<{success: boolean; data?: CalendarEvent[]; errors?: string[]}> {
  const {year, month} = params
  const errors: string[] = []
  const allEvents: CalendarEvent[] = []

  // 両方のカレンダーから取得
  const results = await Promise.allSettled([
    getMonthCalendarEvents({year, month, calendarId: CALENDAR_ID_1}),
    getMonthCalendarEvents({year, month, calendarId: CALENDAR_ID_2}),
  ])

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      const {success, data, error} = result.value
      if (success && data) {
        allEvents.push(...data)
      } else if (error) {
        errors.push(error)
      }
    } else {
      const calendarName = index === 0 ? CALENDAR_ID_1 : CALENDAR_ID_2
      errors.push(`${calendarName}の取得に失敗しました: ${result.reason}`)
    }
  })

  return {
    success: allEvents.length > 0 || errors.length === 0,
    data: allEvents,
    errors: errors.length > 0 ? errors : undefined,
  }
}
