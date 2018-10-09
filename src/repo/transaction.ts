import * as moment from 'moment';
import { Connection } from 'mongoose';

import * as factory from '../factory';
import TransactionModel from './mongoose/model/transaction';

/**
 * 取引リポジトリー
 */
export class MongoRepository {
    public readonly transactionModel: typeof TransactionModel;
    constructor(connection: Connection) {
        this.transactionModel = connection.model(TransactionModel.modelName);
    }
    // tslint:disable-next-line:cyclomatic-complexity max-func-body-length
    public static CREATE_MONGO_CONDITIONS(params: factory.transaction.ISearchConditions<factory.transactionType>) {
        const andConditions: any[] = [
            {
                typeOf: params.typeOf
            }
        ];
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.startFrom !== undefined) {
            andConditions.push({
                startDate: { $gt: params.startFrom }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.startThrough !== undefined) {
            andConditions.push({
                startDate: { $lt: params.startThrough }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.endFrom !== undefined) {
            andConditions.push({
                endDate: {
                    $exists: true,
                    $gte: params.endFrom
                }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.endThrough !== undefined) {
            andConditions.push({
                endDate: {
                    $exists: true,
                    $lt: params.endThrough
                }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(params.ids)) {
            andConditions.push({
                _id: { $in: params.ids }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (Array.isArray(params.statuses)) {
            andConditions.push({
                status: { $in: params.statuses }
            });
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.agent !== undefined) {
            if (Array.isArray(params.agent.ids)) {
                andConditions.push({
                    'agent.id': { $in: params.agent.ids }
                });
            }
        }
        switch (params.typeOf) {
            case factory.transactionType.CancelReservation:
                break;
            case factory.transactionType.Reserve:
                break;
            default:
        }

        return andConditions;
    }
    /**
     * 取引を開始する
     */
    public async start<T extends factory.transactionType>(
        params: factory.transaction.IStartParams<T>
    ): Promise<factory.transaction.ITransaction<T>> {
        return this.transactionModel.create({
            typeOf: params.typeOf,
            ...<Object>params,
            status: factory.transactionStatusType.InProgress,
            startDate: new Date(),
            endDate: undefined,
            tasksExportationStatus: factory.transactionTasksExportationStatus.Unexported
        }).then((doc) => doc.toObject());
    }
    /**
     * IDで取引を取得する
     */
    public async findById<T extends factory.transactionType>(params: {
        typeOf: T;
        id: string;
    }): Promise<factory.transaction.ITransaction<T>> {
        const doc = await this.transactionModel.findOne({
            _id: params.id,
            typeOf: params.typeOf
        }).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Transaction');
        }

        return doc.toObject();
    }
    /**
     * 進行中の取引を取得する
     */
    public async findInProgressById<T extends factory.transactionType>(params: {
        typeOf: T;
        id: string;
    }): Promise<factory.transaction.ITransaction<T>> {
        const doc = await this.transactionModel.findOne({
            _id: params.id,
            typeOf: params.typeOf,
            status: factory.transactionStatusType.InProgress
        }).exec();
        if (doc === null) {
            throw new factory.errors.NotFound('Transaction');
        }

        return doc.toObject();
    }
    /**
     * 取引を確定する
     */
    public async confirm<T extends factory.transactionType>(params: {
        typeOf: T;
        id: string;
        result: factory.transaction.IResult<T>;
        potentialActions: factory.transaction.IPotentialActions<T>;
    }): Promise<factory.transaction.ITransaction<T>> {
        const doc = await this.transactionModel.findOneAndUpdate(
            {
                _id: params.id,
                typeOf: params.typeOf,
                status: factory.transactionStatusType.InProgress
            },
            {
                status: factory.transactionStatusType.Confirmed, // ステータス変更
                endDate: new Date(),
                result: params.result, // resultを更新
                potentialActions: params.potentialActions // resultを更新
            },
            { new: true }
        ).exec();
        // NotFoundであれば取引状態確認
        if (doc === null) {
            const transaction = await this.findById({ typeOf: params.typeOf, id: params.id });
            if (transaction.status === factory.transactionStatusType.Confirmed) {
                // すでに確定済の場合
                return transaction;
            } else if (transaction.status === factory.transactionStatusType.Expired) {
                throw new factory.errors.Argument('Transaction id', 'Transaction already expired');
            } else if (transaction.status === factory.transactionStatusType.Canceled) {
                throw new factory.errors.Argument('Transaction id', 'Transaction already canceled');
            } else {
                throw new factory.errors.NotFound(this.transactionModel.modelName);
            }
        }

        return doc.toObject();
    }
    /**
     * タスク未エクスポートの取引をひとつ取得してエクスポートを開始する
     */
    public async startExportTasks<T extends factory.transactionType>(params: {
        typeOf: T;
        status: factory.transactionStatusType;
    }): Promise<factory.transaction.ITransaction<T> | null> {
        return this.transactionModel.findOneAndUpdate(
            {
                typeOf: params.typeOf,
                status: params.status,
                tasksExportationStatus: factory.transactionTasksExportationStatus.Unexported
            },
            { tasksExportationStatus: factory.transactionTasksExportationStatus.Exporting },
            { new: true }
        ).exec().then((doc) => (doc === null) ? null : doc.toObject());
    }
    /**
     * タスクエクスポートリトライ
     * todo updatedAtを基準にしているが、タスクエクスポートトライ日時を持たせた方が安全か？
     */
    public async reexportTasks(params: { intervalInMinutes: number }): Promise<void> {
        await this.transactionModel.findOneAndUpdate(
            {
                tasksExportationStatus: factory.transactionTasksExportationStatus.Exporting,
                updatedAt: { $lt: moment().add(-params.intervalInMinutes, 'minutes').toISOString() }
            },
            {
                tasksExportationStatus: factory.transactionTasksExportationStatus.Unexported
            }
        ).exec();
    }
    /**
     * set task status exported by transaction id
     * IDでタスクをエクスポート済に変更する
     */
    public async setTasksExportedById(params: { id: string }) {
        await this.transactionModel.findByIdAndUpdate(
            params.id,
            {
                tasksExportationStatus: factory.transactionTasksExportationStatus.Exported,
                tasksExportedAt: moment().toDate()
            }
        ).exec();
    }
    /**
     * 取引を期限切れにする
     */
    public async makeExpired(params: { expires: Date }): Promise<void> {

        // ステータスと期限を見て更新
        await this.transactionModel.update(
            {
                status: factory.transactionStatusType.InProgress,
                endDate: { $lt: params.expires }
            },
            {
                status: factory.transactionStatusType.Expired,
                endDate: params.expires
            },
            { multi: true }
        ).exec();
    }
    /**
     * 取引を中止する
     */
    public async cancel<T extends factory.transactionType>(params: {
        typeOf: T;
        id: string;
    }): Promise<factory.transaction.ITransaction<T>> {
        const endDate = moment().toDate();

        // 進行中ステータスの取引を中止する
        const doc = await this.transactionModel.findOneAndUpdate(
            {
                typeOf: params.typeOf,
                _id: params.id,
                status: factory.transactionStatusType.InProgress
            },
            {
                status: factory.transactionStatusType.Canceled,
                endDate: endDate
            },
            { new: true }
        ).exec();
        // NotFoundであれば取引状態確認
        if (doc === null) {
            const transaction = await this.findById<T>(params);
            if (transaction.status === factory.transactionStatusType.Canceled) {
                // すでに中止済の場合
                return transaction;
            } else if (transaction.status === factory.transactionStatusType.Expired) {
                throw new factory.errors.Argument('Transaction id', 'Transaction already expired');
            } else if (transaction.status === factory.transactionStatusType.Confirmed) {
                throw new factory.errors.Argument('Transaction id', 'Confirmed transaction unable to cancel');
            } else {
                throw new factory.errors.NotFound(this.transactionModel.modelName);
            }
        }

        return doc.toObject();
    }
    public async count<T extends factory.transactionType>(params: factory.transaction.ISearchConditions<T>): Promise<number> {
        const conditions = MongoRepository.CREATE_MONGO_CONDITIONS(params);

        return this.transactionModel.countDocuments(
            { $and: conditions }
        ).setOptions({ maxTimeMS: 10000 })
            .exec();
    }
    /**
     * 取引を検索する
     */
    public async search<T extends factory.transactionType>(
        params: factory.transaction.ISearchConditions<T>
    ): Promise<factory.transaction.ITransaction<T>[]> {
        const conditions = MongoRepository.CREATE_MONGO_CONDITIONS(params);
        const query = this.transactionModel.find(
            { $and: conditions },
            {
                __v: 0,
                createdAt: 0,
                updatedAt: 0
            }
        );
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.limit !== undefined && params.page !== undefined) {
            query.limit(params.limit).skip(params.limit * (params.page - 1));
        }
        // tslint:disable-next-line:no-single-line-block-comment
        /* istanbul ignore else */
        if (params.sort !== undefined) {
            query.sort(params.sort);
        }

        return query.setOptions({ maxTimeMS: 10000 }).exec().then((docs) => docs.map((doc) => doc.toObject()));
    }
}
