import {ControlContextType} from '@cm/types/form-control-type'
import {cn} from '@cm/shadcn/lib/utils'

const ErrorMessage = ({controlContextValue}) => {
  const {ReactHookForm, col, ControlOptions} = controlContextValue as ControlContextType
  const showErrorMessage = ControlOptions?.showErrorMessage ?? true

  const message = ReactHookForm?.formState?.errors[col.id]?.message?.toString()

  if (message && showErrorMessage) {
    return (
      <div className={cn('mt-1 flex items-center gap-1.5 animate-in slide-in-from-top-1 duration-200', 'min-w-[50px] text-end')}>
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-md bg-red-50 px-2 py-1 border border-red-200">
          <svg className="h-3 w-3 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <small className="text-red-700 text-xs font-medium leading-none">{message}</small>
        </div>
      </div>
    )
  } else return <></>
}

export default ErrorMessage
