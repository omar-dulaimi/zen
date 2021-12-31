import { Logger, UseGuards } from '@nestjs/common';
import { Args, Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import gql from 'graphql-tag';
import { GraphQLUpload } from 'graphql-upload';
import { interval } from 'rxjs';

import { GqlGuard, GqlUser, RequestUser, Roles } from '../../auth';
import type { FileInfo } from '../models';

export const SampleTypeDef = gql`
  extend type Mutation {
    sampleUpload(file: Upload!): Boolean!
  }

  type SampleSubscriptionResult {
    message: String!
  }

  type Subscription {
    sampleSubscription: SampleSubscriptionResult!
  }
`;

const pubSub = new PubSub();

interval(1000).subscribe(i =>
  pubSub.publish('sampleSubscription', {
    sampleSubscription: {
      message: `Server ticker ${i}`,
    },
  })
);

@Resolver()
@UseGuards(GqlGuard)
@Roles('Super')
export class SampleResolver {
  @Mutation()
  async sampleUpload(@Args('file', { type: () => GraphQLUpload }) file: FileInfo) {
    const readStream = file.file.createReadStream();
    const chunks = [];
    for await (const chunk of readStream) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    Logger.log(`Recieved '${file.file.filename}' ${buffer.byteLength} bytes`);
    return true;
  }

  @Subscription()
  async sampleSubscription(@GqlUser() user: RequestUser) {
    Logger.log(`sampleSubscription subscribed to by user with id ${user.id}`);
    return pubSub.asyncIterator('sampleSubscription');
  }
}
