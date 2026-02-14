import React from 'react'
import {DynamicGridContainer} from './DynamicGridContainer'
import {AutoGridContainer} from './AutoGridContainer'

// デモ用のカードコンポーネント
const DemoCard: React.FC<{title: string; index: number}> = ({title, index}) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="text-gray-600">カード {index + 1}</p>
  </div>
)

export const GridContainerDemo: React.FC = () => {
  // 異なる数の子要素を持つ配列
  const items1 = Array.from({length: 2}, (_, i) => i)
  const items2 = Array.from({length: 3}, (_, i) => i)
  const items3 = Array.from({length: 5}, (_, i) => i)
  const items4 = Array.from({length: 8}, (_, i) => i)

  return (
    <div className="p-6 space-y-12 bg-gray-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-8">自動調整グリッドコンテナ デモ</h1>

        {/* DynamicGridContainerの例 */}
        <section className="space-y-8">
          <h2 className="text-2xl font-semibold text-gray-700">DynamicGridContainer</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">2つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <DynamicGridContainer>
                {items1.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </DynamicGridContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">3つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <DynamicGridContainer>
                {items2.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </DynamicGridContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">5つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <DynamicGridContainer>
                {items3.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </DynamicGridContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">8つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <DynamicGridContainer>
                {items4.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </DynamicGridContainer>
            </div>
          </div>
        </section>

        {/* AutoGridContainerの例 */}
        <section className="space-y-8 mt-16">
          <h2 className="text-2xl font-semibold text-gray-700">AutoGridContainer</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">2つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <AutoGridContainer>
                {items1.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </AutoGridContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">3つの子要素（最大: sm:2, lg:3, xl:4）</h3>
              <AutoGridContainer>
                {items2.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </AutoGridContainer>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-600 mb-3">カスタム設定: 最大6列まで</h3>
              <AutoGridContainer maxCols={{sm: 3, md: 4, lg: 5, xl: 6}}>
                {items4.map(item => (
                  <DemoCard key={item} title="アイテム" index={item} />
                ))}
              </AutoGridContainer>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default GridContainerDemo
