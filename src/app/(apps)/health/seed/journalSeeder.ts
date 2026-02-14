// 日誌機能のseedデータ
import {doStandardPrisma} from '@cm/lib/server-actions/common-server-actions/doStandardPrisma/doStandardPrisma'
import {HOUR_SLOTS} from '../(constants)/types'

export async function seedJournalData() {
  console.log('日誌データのseedを開始します...')

  try {
    // テスト用ユーザーID（実際の環境に合わせて調整）
    const testUserId = 1

    // 過去7日分の日誌データを作成
    const today = new Date()
    for (let i = 0; i < 7; i++) {
      // 日本時刻での日付を作成
      const date = new Date()
      date.setDate(today.getDate() - i)
      // 日本時刻の00:00に設定（UTCから9時間引く）
      date.setHours(0, 0, 0, 0)
      const jstOffset = 9 * 60 * 60 * 1000 // 9時間をミリ秒で
      const jstDate = new Date(date.getTime() - jstOffset)

      // 日誌を作成
      const journalResult = await doStandardPrisma('healthJournal', 'create', {
        data: {
          userId: testUserId,
          journalDate: jstDate,
          goalAndReflection:
            i === 0
              ? '今日は血糖値の管理を意識して、食事の時間を規則正しくしたい。夜は早めに寝て、明日に備えたい。'
              : i === 1
                ? '昨日は目標通り規則正しい食事ができた。今日も継続していきたい。'
                : '健康的な生活リズムを心がけている。',
          templateApplied: true,
        },
      })

      if (!journalResult.success) {
        console.error(`日誌の作成に失敗しました (${i}日前):`, journalResult.error)
        continue
      }

      const journal = journalResult.result

      // 時間帯ごとのエントリを作成
      for (const hourSlot of HOUR_SLOTS) {
        let comment = ''

        // 時間帯に応じてサンプルコメントを設定
        if (hourSlot === 7) {
          comment = '起床。体調は良好。'
        } else if (hourSlot === 8) {
          comment = '朝食を摂取。血糖値測定済み。'
        } else if (hourSlot === 12) {
          comment = '昼食時間。バランスの良い食事を心がけた。'
        } else if (hourSlot === 19) {
          comment = '夕食。今日も一日お疲れ様でした。'
        } else if (hourSlot === 22) {
          comment = '就寝準備。明日も頑張ろう。'
        } else if (Math.random() > 0.7) {
          // 30%の確率でランダムコメント
          const randomComments = ['体調良好', '少し疲れ気味', '気分爽快', '普通の状態', '集中して作業中', 'リラックスタイム']
          comment = randomComments[Math.floor(Math.random() * randomComments.length)]
        }

        const entryResult = await doStandardPrisma('healthJournalEntry', 'create', {
          data: {
            healthJournalId: journal.id,
            hourSlot,
            comment: comment || null,
          },
        })

        if (!entryResult.success) {
          console.error(`エントリの作成に失敗しました (${i}日前, ${hourSlot}時):`, entryResult.error)
        }
      }
    }

    console.log('日誌データのseedが完了しました')
    return {success: true}
  } catch (error) {
    console.error('日誌データのseedでエラーが発生しました:', error)
    return {success: false, error}
  }
}

// 単体実行用
if (require.main === module) {
  seedJournalData()
    .then(result => {
      if (result.success) {
        console.log('✅ 日誌データのseedが正常に完了しました')
      } else {
        console.error('❌ 日誌データのseedに失敗しました:', result.error)
      }
      process.exit(result.success ? 0 : 1)
    })
    .catch(error => {
      console.error('❌ 予期しないエラーが発生しました:', error)
      process.exit(1)
    })
}
