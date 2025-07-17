import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const LoopNodeDefinition = new NodeDefinition({
  name: 'Loop',
  displayName: 'Loop',
  description: 'Loop over items and execute actions for each',
  version: 1,
  group: ['core'],
  icon: 'fa:sync',
  defaults: {
    name: 'Loop',
    color: '#00AA44',
  },
  inputs: ['main'],
  outputs: ['main', 'done'],
  properties: [
    {
      name: 'mode',
      displayName: 'Mode',
      type: 'options',
      options: [
        { name: 'Split Items', value: 'splitItems' },
        { name: 'Batch Items', value: 'batchItems' },
        { name: 'Loop N Times', value: 'loopCount' },
      ],
      default: 'splitItems',
      required: true,
    },
    {
      name: 'batchSize',
      displayName: 'Batch Size',
      type: 'number',
      default: 10,
      displayOptions: {
        show: {
          mode: ['batchItems'],
        },
      },
      description: 'Number of items per batch',
    },
    {
      name: 'loopCount',
      displayName: 'Loop Count',
      type: 'number',
      default: 5,
      displayOptions: {
        show: {
          mode: ['loopCount'],
        },
      },
      description: 'Number of times to loop',
    },
    {
      name: 'splitField',
      displayName: 'Split Field',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          mode: ['splitItems'],
        },
      },
      placeholder: 'items',
      description:
        'Field containing array to split. Leave empty to split input array.',
    },
    {
      name: 'addIndex',
      displayName: 'Add Index',
      type: 'boolean',
      default: true,
      description: 'Add $index field to each item',
    },
    {
      name: 'resetIndex',
      displayName: 'Reset Index Per Input',
      type: 'boolean',
      default: false,
      description: 'Reset index to 0 for each input item',
    },
  ],
});

export class LoopNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const { mode, batchSize, loopCount, splitField, addIndex, resetIndex } =
      context.parameters;

    try {
      let outputData: any[] = [];
      let doneData: any[] = [];

      switch (mode) {
        case 'splitItems':
          ({ outputData, doneData } = this.splitItems(context));
          break;
        case 'batchItems':
          ({ outputData, doneData } = this.batchItems(
            context,
            batchSize || 10,
          ));
          break;
        case 'loopCount':
          ({ outputData, doneData } = this.loopNTimes(context, loopCount || 5));
          break;
      }

      return {
        success: true,
        data: outputData,
        outputs: {
          main: outputData,
          done: doneData,
        },
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: outputData.length,
          mode,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  private splitItems(context: NodeExecutionContext): {
    outputData: any[];
    doneData: any[];
  } {
    const { splitField, addIndex, resetIndex } = context.parameters;
    const outputData: any[] = [];
    const doneData: any[] = [];
    let globalIndex = 0;

    for (const item of context.inputData) {
      // Get array to split
      let arrayToSplit: any[];
      if (splitField && item[splitField]) {
        arrayToSplit = Array.isArray(item[splitField])
          ? item[splitField]
          : [item[splitField]];
      } else {
        arrayToSplit = [item];
      }

      let localIndex = 0;
      for (const subItem of arrayToSplit) {
        const index = resetIndex ? localIndex : globalIndex;
        const outputItem = {
          ...item,
          ...(typeof subItem === 'object' ? subItem : { value: subItem }),
        };

        if (addIndex) {
          outputItem.$index = index;
          outputItem.$total = arrayToSplit.length;
        }

        outputData.push(outputItem);
        localIndex++;
        globalIndex++;
      }

      // Add original item to done output
      doneData.push({
        ...item,
        $itemsProcessed: arrayToSplit.length,
      });
    }

    return { outputData, doneData };
  }

  private batchItems(
    context: NodeExecutionContext,
    batchSize: number,
  ): { outputData: any[]; doneData: any[] } {
    const { addIndex } = context.parameters;
    const outputData: any[] = [];
    const doneData: any[] = [];

    // Create batches
    const batches: any[][] = [];
    let currentBatch: any[] = [];

    for (let i = 0; i < context.inputData.length; i++) {
      currentBatch.push(context.inputData[i]);

      if (
        currentBatch.length === batchSize ||
        i === context.inputData.length - 1
      ) {
        batches.push(currentBatch);
        currentBatch = [];
      }
    }

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchData: any = {
        $batch: batch,
        $batchSize: batch.length,
        $batchIndex: batchIndex,
        $totalBatches: batches.length,
      };

      if (addIndex) {
        batchData.$index = batchIndex;
      }

      outputData.push(batchData);
    }

    // Done output contains summary
    doneData.push({
      $totalItems: context.inputData.length,
      $totalBatches: batches.length,
      $batchSize: batchSize,
    });

    return { outputData, doneData };
  }

  private loopNTimes(
    context: NodeExecutionContext,
    count: number,
  ): { outputData: any[]; doneData: any[] } {
    const { addIndex } = context.parameters;
    const outputData: any[] = [];
    const doneData: any[] = [];

    for (const item of context.inputData) {
      for (let i = 0; i < count; i++) {
        const outputItem = {
          ...item,
          $iteration: i,
          $totalIterations: count,
        };

        if (addIndex) {
          outputItem.$index = i;
        }

        outputData.push(outputItem);
      }

      // Add to done output
      doneData.push({
        ...item,
        $loopCount: count,
      });
    }

    return { outputData, doneData };
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
