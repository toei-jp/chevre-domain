import * as moment from 'moment';
import { Connection } from 'mongoose';
import taskModel from './mongoose/model/task';

import * as factory from '../factory';

/**
 * タスク実行時のソート条件
 */
const sortOrder4executionOfTasks = {
    numberOfTried: 1, // トライ回数の少なさ優先
    runsAt: 1 // 実行予定日時の早さ優先
};
/**
 * タスクリポジトリ
 */
export class MongoRepository {
    public readonly taskModel: typeof taskModel;
    constructor(connection: Connection) {
        this.taskModel = connection.model(taskModel.modelName);
    }
    public async save(taskAttributes: factory.task.IAttributes): Promise<factory.task.ITask> {
        return this.taskModel.create(taskAttributes).then(
            (doc) => <factory.task.ITask>doc.toObject()
        );
    }
    public async executeOneByName(taskName: factory.taskName): Promise<factory.task.ITask | null> {
        const doc = await this.taskModel.findOneAndUpdate(
            {
                status: factory.taskStatus.Ready,
                runsAt: { $lt: new Date() },
                name: taskName
            },
            {
                status: factory.taskStatus.Running, // 実行中に変更
                lastTriedAt: new Date(),
                $inc: {
                    remainingNumberOfTries: -1, // 残りトライ可能回数減らす
                    numberOfTried: 1 // トライ回数増やす
                }
            },
            { new: true }
        ).sort(sortOrder4executionOfTasks).exec();
        if (doc === null) {
            return null;
        }

        return <factory.task.ITask>doc.toObject();
    }
    public async retry(intervalInMinutes: number) {
        const lastTriedAtShoudBeLessThan = moment().add(-intervalInMinutes, 'minutes').toDate();
        await this.taskModel.update(
            {
                status: factory.taskStatus.Running,
                lastTriedAt: { $lt: lastTriedAtShoudBeLessThan },
                remainingNumberOfTries: { $gt: 0 }
            },
            {
                status: factory.taskStatus.Ready // 実行前に変更
            },
            { multi: true }
        ).exec();
    }
    public async abortOne(intervalInMinutes: number): Promise<factory.task.ITask | null> {
        const lastTriedAtShoudBeLessThan = moment().add(-intervalInMinutes, 'minutes').toDate();
        const doc = await this.taskModel.findOneAndUpdate(
            {
                status: factory.taskStatus.Running,
                lastTriedAt: { $lt: lastTriedAtShoudBeLessThan },
                remainingNumberOfTries: 0
            },
            {
                status: factory.taskStatus.Aborted
            },
            { new: true }
        ).exec();
        if (doc === null) {
            return null;
        }

        return <factory.task.ITask>doc.toObject();
    }
    public async pushExecutionResultById(
        id: string,
        status: factory.taskStatus,
        executionResult: factory.taskExecutionResult.IAttributes
    ): Promise<void> {
        await this.taskModel.findByIdAndUpdate(
            id,
            {
                status: status, // 失敗してもここでは戻さない(Runningのまま待機)
                $push: { executionResults: executionResult }
            }
        ).exec();
    }
}
