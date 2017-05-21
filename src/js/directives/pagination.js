app.directive('pagination', function() {
  return {
    restrict: 'E',
    replace: true,
    templateUrl: '/templates/elements/pagination.html',
    scope: {
      pager: '=',
      callback: '&'
    },
    link: function (scope, element, attrs) {
      var $paginationList = $(element[0].querySelector('.pagination-list'));
      scope.selectPage = function(index){
        //Calculate offset
        var offset = 0;
        var minPage = 4;
        var maxPage = scope.pager.totalPages - minPage - 1;
        if (scope.pager.totalPages >= 10){
          if (index > minPage && index < maxPage) {
            offset = -(index-minPage)*40;
          } else if (index >= maxPage){
            offset = -(scope.pager.totalPages-10)*40;
          }
        }
        //Apply offset
        $paginationList.css('left', offset);
        //Call callback
        scope.callback({'index':index});
      };

      scope.previousPage = function(){
        if (scope.pager.hasPreviousPage){
          scope.selectPage(scope.pager.currentPage - 1);
        }
      }

      scope.nextPage = function(){
        if (scope.pager.hasNextPage){
          scope.selectPage(scope.pager.currentPage + 1);
        }
      }

      scope.firstPage = function(){
        scope.selectPage(0);
      }

      scope.lastPage = function(){
        scope.selectPage(scope.pager.totalPages-1);
      }
    }
  };
});
