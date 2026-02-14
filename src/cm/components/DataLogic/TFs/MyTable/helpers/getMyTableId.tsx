export const getMyTableId = ({dataModelName, myTable}) => {
  return myTable?.tableId || `tabled-id-${dataModelName}`
}
