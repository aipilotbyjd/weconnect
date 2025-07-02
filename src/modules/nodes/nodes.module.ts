import { Module } from '@nestjs/common';
import { NodeRegistryService } from './application/registry/node-registry.service';
import { BuiltInNodesService } from './application/registry/built-in-nodes.service';
import { NodesController } from './presentation/controllers/nodes.controller';

@Module({
  controllers: [NodesController],
  providers: [
    NodeRegistryService,
    BuiltInNodesService,
  ],
  exports: [
    NodeRegistryService,
    BuiltInNodesService,
  ],
})
export class NodesModule {}
