import { ResizeCheckerProvider } from 'ui/resize_checker';
import { Notifier } from 'ui/notify';

import { VegaView } from './vega_view';
// import moment from 'moment';

import hjson from 'hjson';

export function createVegaVisController(Private, /*$scope,*/ timefilter, es, serviceSettings) {
  const ResizeChecker = Private(ResizeCheckerProvider);

  class VegaVisController {
    messages = [];
    onError = (error) => this.messages.push({ type: 'error', error });
    onWarn = (warning) => this.messages.push({ type: 'warning', warning });

    link($scope, $el/*, $attr*/) {
      const resizeChecker = new ResizeChecker($el);

      $scope.timefilter = timefilter;
      $scope.$watchMulti(['=vega.vis.params', '=timefilter'], async () => {
        this.messages = [];

        // FIXME!!  need to debounce editor changes

        try {
          const spec = hjson.parse($scope.vega.vis.params.spec);
          if (this.vegaView) {
            await this.vegaView.destroy();
          }
          this.vegaView = new VegaView($el, spec, timefilter, es, serviceSettings, this.onError, this.onWarn);
          await this.vegaView.init();
        } catch (error) {
          this.onError(error);
        }

        resizeChecker.modifySizeWithoutTriggeringResize(() => this.vegaView.resize());
      });

      resizeChecker.on('resize', () => {
        resizeChecker.modifySizeWithoutTriggeringResize(() => this.vegaView.resize());
      });

      $scope.$on('$destroy', () => {
        this.vegaView.destroy().catch(error => this.onError(error));
      });
    }
    //
    // onEsResponse(vis, esResponse) {
    //   if (!this.vegaView) {
    //     throw new Error('esResponse provided before vegaView was initialized');
    //   }
    //
    //   if (!vis || !esResponse) {
    //     this.vegaView.setData([]);
    //     return;
    //   }
    //
    //   const { columns, rows } = tabify(vis, esResponse, {
    //     canSplit: false,
    //     partialRows: true,
    //     minimalColumns: false,
    //     // metricsForAllBuckets: false,
    //     asAggConfigResults: false,
    //   });
    //
    //   const aggTypeCounters = {};
    //   const columnNames = columns.map(col => {
    //     const typeName = col.aggConfig.type.type;
    //     const count = (aggTypeCounters[typeName] || 0) + 1;
    //     aggTypeCounters[typeName] = count;
    //     return `${typeName}${count}`;
    //   });
    //
    //   const vegaTable = rows.map(row => {
    //     return columns.reduce((acc, column, i) => {
    //       let value = row[i];
    //       const field = column.aggConfig.getField();
    //       if (field && field.type === 'date') {
    //         value = moment(value);
    //       }
    //       acc[columnNames[i]] = value;
    //       return acc;
    //     }, {});
    //   });
    //
    //   this.vegaView.setData(vegaTable);
    // }
  }

  return new VegaVisController();
}
