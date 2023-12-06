<template>
  <div id="tool">
    <el-button
      @click="startHandler"
      type="primary"
      size="mini"
      style="width: 80px"
      >{{ running ? '停止' : '開始' }}</el-button
    >
    <el-button
      size="mini"
      @click="showRemoveoptions = true"
      style="width: 80px"
    >
      リセット
    </el-button>

    <el-dialog
      :append-to-body="true"
      :visible.sync="showSetwat"
      class="setwat-dialog"
      width="400px"
    >
      <el-form ref="form" :model="form" label-width="80px" size="mini">
        <el-form-item label="抽選賞品">
          <el-select
            v-model="form.category"
            placeholder="今回の抽選賞品を選択してください"
          >
            <el-option
              :label="item.label"
              :value="item.value"
              v-for="(item, index) in categorys"
              :key="index"
            ></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label=" " v-if="form.category">
          <span>
            共&nbsp;
            <span class="colorred">{{ config[form.category] }}</span>
            &nbsp;人
          </span>
          <span :style="{ marginLeft: '20px' }">
            残り&nbsp;
            <span class="colorred">{{ remain }}</span>
            &nbsp;人
          </span>
        </el-form-item>

        <el-form-item label="抽選方法">
          <el-select
            v-model="form.mode"
            placeholder="今回の抽選方法を選択してください"
          >
            <el-option label="1人抽選" :value="1"></el-option>
            <el-option label="5人抽選" :value="5"></el-option>
            <el-option label="一度に全員抽選" :value="0"></el-option>
            <el-option label="カスタム" :value="99"></el-option>
          </el-select>
        </el-form-item>

        <el-form-item label="抽選人数" v-if="form.mode === 99">
          <el-input
            v-model="form.qty"
            type="number"
            :clearable="true"
            :min="1"
            :max="remain ? remain : 100"
            :step="1"
          ></el-input>
        </el-form-item>

        <el-form-item label="全員参加">
          <el-switch v-model="form.allin"></el-switch>
          <span :style="{ fontSize: '12px' }">
            (有効にすると、抽選対象は全メンバー[当選者の有無に関係なく]となります)
          </span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit">即時抽選</el-button>
          <el-button @click="showSetwat = false">キャンセル</el-button>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog
      :append-to-body="true"
      :visible.sync="showImport"
      class="import-dialog"
      width="400px"
    >
      <el-input
        type="textarea"
        :rows="10"
        placeholder="请输入对应的号码和名单(可直接从excel复制)，格式(号码 名字)，导入的名单将代替号码显示在抽奖中。如：
1 张三
2 李四
3 王五
				"
        v-model="listStr"
      ></el-input>
      <div class="footer">
        <el-button size="mini" type="primary" @click="transformList"
          >確定</el-button
        >
        <el-button size="mini" @click="showImport = false"
          >キャンセル</el-button
        >
      </div>
    </el-dialog>
    <Importphoto
      :visible.sync="showImportphoto"
      @getPhoto="$emit('getPhoto')"
    ></Importphoto>

    <el-dialog
      :visible.sync="showRemoveoptions"
      width="300px"
      class="c-removeoptions"
      :append-to-body="true"
    >
      <el-form ref="form" :model="removeInfo" label-width="80px" size="mini">
        <el-form-item label=" " style="margin-left: -30px">
          <el-radio-group v-model="removeInfo.type" style="margin-top: 10px">
            <el-radio border :label="0">全データをリセット</el-radio>
            <el-radio border :label="1">抽選設定をリセット</el-radio>
            <!-- <el-radio border :label="2">名簿をリセット</el-radio> -->
            <!-- <el-radio border :label="3">写真をリセット</el-radio> -->
            <el-radio border :label="4">抽選結果をリセット</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            @click="resetConfig"
            style="width: 120px; margin-left: -12px"
            >リセット確定</el-button
          >
          <el-button
            @click="showRemoveoptions = false"
            style="margin-top: 10px; width: 120px; margin-left: -12px"
            >キャンセル</el-button
          >
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
import {
  clearData,
  removeData,
  configField,
  listField,
  resultField,
  conversionCategoryName
} from '@/helper/index';
import Importphoto from './Importphoto';
import { database, DB_STORE_NAME } from '@/helper/db';

export default {
  props: {
    running: Boolean,
    closeRes: Function
  },
  computed: {
    config: {
      get() {
        return this.$store.state.config;
      }
    },
    remain() {
      return (
        this.config[this.form.category] -
        (this.result[this.form.category]
          ? this.result[this.form.category].length
          : 0)
      );
    },
    result() {
      return this.$store.state.result;
    },
    categorys() {
      const options = [];
      for (const key in this.config) {
        if (this.config.hasOwnProperty(key)) {
          const item = this.config[key];
          if (item > 0) {
            let name = conversionCategoryName(key);
            name &&
              options.push({
                label: name,
                value: key
              });
          }
        }
      }
      return options;
    }
  },
  components: { Importphoto },
  data() {
    return {
      showSetwat: false,
      showImport: false,
      showImportphoto: false,
      showRemoveoptions: false,
      removeInfo: { type: 0 },
      form: {
        category: '',
        mode: 1,
        qty: 1,
        allin: false
      },
      listStr: ''
    };
  },
  watch: {
    showRemoveoptions(v) {
      if (!v) {
        this.removeInfo.type = 0;
      }
    }
  },
  methods: {
    resetConfig() {
      const type = this.removeInfo.type;
      this.$confirm(
        'この操作は選択したデータをリセットします。続行しますか？',
        '警告',
        {
          confirmButtonText: '確認',
          cancelButtonText: 'キャンセル',
          type: 'warning'
        }
      )
        .then(() => {
          switch (type) {
            case 0:
              clearData();
              this.$store.commit('setClearStore');
              database.clear(DB_STORE_NAME);
              break;
            case 1:
              removeData(configField);
              this.$store.commit('setClearConfig');
              break;
            case 2:
              removeData(listField);
              this.$store.commit('setClearList');
              break;
            case 3:
              database.clear(DB_STORE_NAME);
              this.$store.commit('setClearPhotos');
              break;
            case 4:
              removeData(resultField);
              this.$store.commit('setClearResult');
              break;
            default:
              break;
          }

          this.closeRes && this.closeRes();

          this.showRemoveoptions = false;
          this.$message({
            type: 'success',
            message: 'リセット成功！'
          });

          this.$nextTick(() => {
            this.$emit('resetConfig');
          });
        })
        .catch(() => {
          this.$message({
            type: 'info',
            message: 'キャンセルされました'
          });
        });
    },
    onSubmit() {
      if (!this.form.category) {
        return this.$message.error('今回の抽選賞品を選択してください');
      }
      if (this.remain <= 0) {
        return this.$message.error('この賞品の残り人数が不足しています');
      }
      if (this.form.mode === 99) {
        if (this.form.qty <= 0) {
          return this.$message.error('今回の抽選人数を入力してください');
        }
        if (this.form.qty > this.remain) {
          return this.$message.error(
            '今回の抽選人数が賞品の残り人数を超えています'
          );
        }
      }
      if (this.form.mode === 1 || this.form.mode === 5) {
        if (this.form.mode > this.remain) {
          return this.$message.error(
            '今回の抽選人数が賞品の残り人数を超えています'
          );
        }
      }
      this.showSetwat = false;
      this.$emit(
        'toggle',
        Object.assign({}, this.form, { remain: this.remain })
      );
    },
    startHandler() {
      this.$emit('toggle');
      if (!this.running) {
        this.showSetwat = true;
      }
    },
    transformList() {
      const { listStr } = this;
      if (!listStr) {
        this.$message.error('没有数据');
      }
      const list = [];
      const rows = listStr.split('\n');
      if (rows && rows.length > 0) {
        rows.forEach(item => {
          const rowList = item.split(/\t|\s/);
          if (rowList.length >= 2) {
            const key = Number(rowList[0].trim());
            const name = rowList[1].trim();
            key &&
              list.push({
                key,
                name
              });
          }
        });
      }
      this.$store.commit('setList', list);

      this.$message({
        message: '保存成功',
        type: 'success'
      });
      this.showImport = false;
      this.$nextTick(() => {
        this.$emit('resetConfig');
      });
    }
  }
};
</script>
<style lang="scss">
#tool {
  position: fixed;
  width: 60px;
  top: 90%;
  right: 20px;
  transform: translateY(-50%);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  .el-button + .el-button {
    margin-top: 20px;
    margin-left: 0px;
  }
}
// 抽取人数字体颜色
.setwat-dialog {
  .colorred {
    color: red;
    font-weight: bold;
  }
}

.import-dialog {
  .footer {
    height: 50px;
    line-height: 50px;
    text-align: center;
  }
}
.c-removeoptions {
  .el-dialog {
    height: 290px;
  }
  .el-radio.is-bordered + .el-radio.is-bordered {
    margin-left: 0px;
  }
  .el-radio.is-bordered {
    margin-bottom: 10px;
  }
}
</style>
