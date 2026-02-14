export const confirmSearch = ({
  allData,
  MainColObject,
  SearchColObject,
  dataModelName,
  addQuery,
  searchQueryKey,
  SearchQuery,
  toggleLoad,
}) => {
  const searchQueryResult = SearchQuery.createQueryStr({allData, MainColObject, SearchColObject})

  const newQuery = {
    [searchQueryKey]: `${dataModelName.toUpperCase()}${searchQueryResult}`,
  }

  toggleLoad(async () => {
    addQuery(newQuery)
  })
}
