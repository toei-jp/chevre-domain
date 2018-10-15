import { Connection } from 'mongoose';
import entertainmentTypeModel from './mongoose/model/entertainmentType';

import * as factory from '../factory';

/**
 * 配給レポジトリー
 */
export class MongoRepository {
    public readonly entertainmentTypeModel: typeof entertainmentTypeModel;

    constructor(connection: Connection) {
        this.entertainmentTypeModel = connection.model(entertainmentTypeModel.modelName);
    }

    public async save(
        entertainmentTypeAttributes: factory.entertainmentType.IEntertainmentType
    ): Promise<factory.entertainmentType.IEntertainmentType> {
        return this.entertainmentTypeModel.create(entertainmentTypeAttributes).then(
            (doc) => <factory.entertainmentType.IEntertainmentType>doc.toObject()
        );
    }

    public async getEntertainmentType(): Promise<factory.entertainmentType.IEntertainmentType[]> {
        const query = this.entertainmentTypeModel.find({});

        return query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
    }

}
