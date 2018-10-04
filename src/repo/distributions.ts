import { Connection } from 'mongoose';
import distributionsModel from './mongoose/model/distributions';

import * as factory from '../factory';

/**
 * 配給レポジトリー
 */
export class MongoRepository {
    public readonly distributionsModel: typeof distributionsModel;

    constructor(connection: Connection) {
        this.distributionsModel = connection.model(distributionsModel.modelName);
    }

    public async save(
        distributionsAttributes: factory.distributions.distribute.IDistributions
    ): Promise<factory.distributions.distribute.IDistributions> {
        return this.distributionsModel.create(distributionsAttributes).then(
            (doc) => <factory.distributions.distribute.IDistributions>doc.toObject()
        );
    }

    public async getDistributions(): Promise<factory.distributions.distribute.IDistributions[]> {
        const query = this.distributionsModel.find({});

        return query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
    }

}
