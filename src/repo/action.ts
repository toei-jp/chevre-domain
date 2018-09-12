import * as createDebug from 'debug';
import { Connection } from 'mongoose';

import * as factory from '../factory';
import ActionModel from './mongoose/model/action';

const debug = createDebug('chevre-domain:repo');

export type IAction<T extends factory.actionType> =
    T extends factory.actionType ? factory.action.IAction<factory.action.IAttributes<any, any>> :
    factory.action.IAction<factory.action.IAttributes<any, any>>;

/**
 * アクションリポジトリー
 */
export class MongoRepository {
    public readonly actionModel: typeof ActionModel;

    constructor(connection: Connection) {
        this.actionModel = connection.model(ActionModel.modelName);
    }
    /**
     * アクション開始
     */
    public async start<T extends factory.actionType>(params: factory.action.IAttributes<any, any>): Promise<IAction<T>> {
        return this.actionModel.create({
            ...params,
            actionStatus: factory.actionStatusType.ActiveActionStatus,
            startDate: new Date()
        }).then(
            (doc) => doc.toObject()
        );
    }
    /**
     * アクション完了
     */
    public async complete<T extends factory.actionType>(
        typeOf: T,
        actionId: string,
        result: any
    ): Promise<IAction<T>> {
        return this.actionModel.findOneAndUpdate(
            {
                typeOf: typeOf,
                _id: actionId
            },
            {
                actionStatus: factory.actionStatusType.CompletedActionStatus,
                result: result,
                endDate: new Date()
            },
            { new: true }
        ).exec().then((doc) => {
            if (doc === null) {
                throw new factory.errors.NotFound('action');
            }

            return doc.toObject();
        });
    }
    /**
     * アクション中止
     */
    public async cancel<T extends factory.actionType>(
        typeOf: T,
        actionId: string
    ): Promise<IAction<T>> {
        return this.actionModel.findOneAndUpdate(
            {
                typeOf: typeOf,
                _id: actionId
            },
            { actionStatus: factory.actionStatusType.CanceledActionStatus },
            { new: true }
        ).exec()
            .then((doc) => {
                if (doc === null) {
                    throw new factory.errors.NotFound('action');

                }

                return doc.toObject();
            });
    }
    /**
     * アクション失敗
     */
    public async giveUp<T extends factory.actionType>(
        typeOf: T,
        actionId: string,
        error: any
    ): Promise<IAction<T>> {
        return this.actionModel.findOneAndUpdate(
            {
                typeOf: typeOf,
                _id: actionId
            },
            {
                actionStatus: factory.actionStatusType.FailedActionStatus,
                error: error,
                endDate: new Date()
            },
            { new: true }
        ).exec().then((doc) => {
            if (doc === null) {
                throw new factory.errors.NotFound('action');
            }

            return doc.toObject();
        });
    }
    /**
     * IDで取得する
     */
    public async findById<T extends factory.actionType>(
        typeOf: T,
        actionId: string
    ): Promise<IAction<T>> {
        return this.actionModel.findOne(
            {
                typeOf: typeOf,
                _id: actionId
            },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        ).exec()
            .then((doc) => {
                if (doc === null) {
                    throw new factory.errors.NotFound('action');
                }

                return doc.toObject();
            });
    }
    /**
     * アクションを検索する
     * @param searchConditions 検索条件
     */
    public async search<T extends factory.actionType>(searchConditions: {
        typeOf: T;
        actionStatuses?: factory.actionStatusType[];
        startDateFrom?: Date;
        startDateThrough?: Date;
        purposeTypeOfs?: factory.transactionType[];
        limit: number;
    }): Promise<IAction<T>[]> {
        const andConditions: any[] = [
            { typeOf: searchConditions.typeOf },
            {
                startDate: {
                    $exists: true,
                    $gte: searchConditions.startDateFrom,
                    $lte: searchConditions.startDateThrough
                }
            }
        ];

        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(searchConditions.actionStatuses) && searchConditions.actionStatuses.length > 0) {
            andConditions.push({
                actionStatus: { $in: searchConditions.actionStatuses }
            });
        }

        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(searchConditions.purposeTypeOfs) && searchConditions.purposeTypeOfs.length > 0) {
            andConditions.push({
                'purpose.typeOf': {
                    $exists: true,
                    $in: searchConditions.purposeTypeOfs
                }
            });
        }
        debug('finding actions...', andConditions);

        return this.actionModel.find(
            { $and: andConditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        )
            .sort({ _id: 1 })
            .limit(searchConditions.limit)
            .exec()
            .then((docs) => docs.map((doc) => doc.toObject()));
    }
}
