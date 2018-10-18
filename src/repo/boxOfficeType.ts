import { Connection } from 'mongoose';
import boxOfficeTypeModel from './mongoose/model/boxOfficeType';

import * as factory from '../factory';

/**
 * 興行区分レポジトリー
 */
export class MongoRepository {
    public readonly boxOfficeTypeModel: typeof boxOfficeTypeModel;

    constructor(connection: Connection) {
        this.boxOfficeTypeModel = connection.model(boxOfficeTypeModel.modelName);
    }

    public async save(
        boxOfficeTypeAttributes: factory.boxOfficeType.IBoxOfficeType
    ): Promise<factory.boxOfficeType.IBoxOfficeType> {
        return this.boxOfficeTypeModel.create(boxOfficeTypeAttributes).then(
            (doc) => <factory.boxOfficeType.IBoxOfficeType>doc.toObject()
        );
    }

    public async getBoxOfficeTypeList(): Promise<factory.boxOfficeType.IBoxOfficeType[]> {
        const query = this.boxOfficeTypeModel.find({});

        return query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
    }

}
