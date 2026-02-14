// import {MinusIcon} from 'lucide-react'
// import {showResetBtn} from '@cm/hooks/useBasicForm/hookformMethods'
// import {useCallback} from 'react'
// import {DH__switchColType} from '@cm/class/DataHandler/type-converter'

// export const useResetBtn = ({col, field, useResetValue, isBooleanType, Register, currentValue, ControlOptions}) => {
//   const convertedType = DH__switchColType({type: col.type})
//   let nullvalue
//   switch (convertedType) {
//     case 'text':
//     case 'color':
//     case 'time': {
//       nullvalue = ''
//       break
//     }

//     default: {
//       nullvalue = null
//       break
//     }
//   }

//   const ResetBtnCallBack = useCallback(() => {
//     return (
//       <>
//         {showResetBtn({col, isBooleanType, Register, currentValue, ControlOptions}) && !ControlOptions.shownButDisabled && (
//           <div
//             onClick={() => {
//               useResetValue({col, field})
//             }}
//           >
//             <MinusIcon className={`  h-4   text-gray-400   hover:cursor-pointer`}></MinusIcon>
//           </div>
//         )}
//       </>
//     )
//   }, [col, isBooleanType, Register, currentValue, ControlOptions, useResetValue, field])

//   return {ResetBtnCallBack}
// }
// export default useResetBtn
