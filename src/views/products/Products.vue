<template>
  <div class="products-container">
    <section class="product-search-panel" aria-label="应用搜索与操作">
      <div class="product-filter-bar">
        <div class="filter-primary-row">
          <div class="filter-field filter-keyword">
            <span class="filter-label">应用搜索</span>
            <AppSearchInput v-model="searchName" class="filter-name-input" aria-label="应用名称或 App ID" :prefix-icon="Search" @search="handleSearch" />
          </div>
          <div class="filter-field">
            <span class="filter-label">状态</span>
            <el-select
              v-model="selectedStatus"
              placeholder="全部状态" aria-label="状态"
              clearable
              class="filter-status-select"
              @change="handleFilterChange"
            >
              <el-option label="已上线" :value="1" />
              <el-option label="已下线" :value="0" />
            </el-select>
          </div>
          <div class="filter-field">
            <span class="filter-label">分类</span>
            <el-select
              v-model="selectedCategoryId"
              placeholder="全部分类" aria-label="分类"
              clearable
              filterable
              class="filter-category-select"
              @change="handleFilterChange"
            >
              <el-option
                v-for="cat in allCategories"
                :key="cat.id"
                :label="cat.name"
                :value="cat.id"
              />
            </el-select>
          </div>
          <div class="filter-field">
            <span class="filter-label">创作者</span>
            <UserSelect
              v-model="selectedCreatorId"
              :role-authorities="['ROLE_DESIGNER']"
              placeholder="全部创作者" aria-label="创作者"
              class="filter-creator-select"
              @change="handleFilterChange"
            />
          </div>
          <el-button type="primary" :icon="Search" class="filter-search-button" @click="handleSearch">搜索</el-button>
        </div>
        <div class="filter-secondary-row">
          <div class="filter-field">
            <span class="filter-label">上线时间</span>
            <el-select v-model="goLivePreset" aria-label="上线时间" class="filter-date-preset" @change="handleGoLiveChange">
              <el-option label="不限上线时间" value="" />
              <el-option label="近 7 天" value="last7" />
              <el-option label="近 30 天" value="last30" />
              <el-option label="近 90 天" value="last90" />
            </el-select>
          </div>
          <div class="filter-field">
            <span class="filter-label">创建时间</span>
            <el-select
              aria-label="创建时间" v-model="createdAtPreset"
              placeholder="创建时间"
              clearable
              class="filter-date-preset"
              @change="handleCreatedAtPresetChange"
            >
              <el-option
                v-for="option in createdAtPresetOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
          </div>
          <div class="filter-field filter-range-field">
            <span class="filter-label">日期范围</span>
            <el-date-picker
              aria-label="日期范围" v-model="createdAtRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              :shortcuts="createdAtShortcuts"
              class="filter-date-range"
              @change="handleCreatedAtRangeChange"
            />
          </div>
          <div class="filter-field">
            <span class="filter-label">排序方式</span>
            <el-select aria-label="排序方式" v-model="sortOrder" placeholder="排序方式" class="filter-sort-select" @change="handleSort">
              <el-option label="上线时间倒序" value="last_go_live:desc" />
              <el-option label="上线时间升序" value="last_go_live:asc" />
              <el-option label="创建时间升序" value="created_at:asc" />
              <el-option label="创建时间倒序" value="created_at:desc" />
              <el-option label="更新时间升序" value="updated_at:asc" />
              <el-option label="更新时间倒序" value="updated_at:desc" />
              <el-option label="下载量倒序" value="download:desc" />
              <el-option label="下载量升序" value="download:asc" />
            </el-select>
          </div>
        </div>
      </div>
      <div class="product-actions-bar">
        <div class="product-actions-group">
          <el-button :icon="TrendCharts" @click="handleRecentOnlineDownloads">近30天上线下载排行</el-button>
          <el-button :icon="Refresh" @click="handleRefreshStats" :loading="refreshingStats">刷新统计</el-button>
        </div>
        <div class="product-actions-group">
          <el-button @click="toggleBatchMode" :disabled="selectedBatchSubmitting">{{ batchMode ? '退出批量操作' : '勾选批量操作' }}</el-button>
          <el-button @click="openTrialDurationDialog">批量修改试用时长</el-button>
          <el-button @click="bulkCategoryDialogVisible = true">一键管理分类</el-button>
          <el-dropdown trigger="click" @command="handleResetAllStoreWeights">
            <el-button :loading="resettingStoreWeights" :disabled="resettingStoreWeights">
              更多操作<el-icon class="more-actions-icon"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="reset-weights" :disabled="resettingStoreWeights">
                  <span class="reset-weights-action">重置所有应用权重</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </section>

    <div v-if="batchMode" class="product-actions-bar">
      <span>已选 {{ selectedProducts.length }} 个应用（仅当前页，翻页或搜索后清空）</span>
      <el-button type="primary" :disabled="!selectedProducts.length || selectedBatchSubmitting" @click="selectedBatchDialogVisible = true">操作选中应用</el-button>
    </div>
    <ResponsiveTableShell mobile-mode="cards">
      <template #table>
        <el-table ref="productTable" :data="products" row-key="appId" style="width: 100%" v-loading="loading" @selection-change="selectedProducts = $event">
      <TableActionColumn :selection="batchMode">
        <template #default="{ row }">
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="openStore(row)">打开商店</el-button>
            <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="copyToClipboard(row.garminStoreUrl)">复制链接</el-button>
            <el-button type="primary" link @click="copyAppMeta(row)">复制信息</el-button>
            <el-button type="primary" link @click="openPoints(row.appId)">积分兑换</el-button>
            <el-button type="primary" link :loading="syncing.get(row.appId) === 'index'" :disabled="syncing.has(row.appId)" @click="handleSync(row, 'index')">同步索引</el-button>
            <el-button type="primary" link :loading="syncing.get(row.appId) === 'cn'" :disabled="syncing.has(row.appId)" @click="handleSync(row, 'cn')">同步到国内数据库</el-button>
            <el-button
              :type="row.status === 1 ? 'danger' : 'success'"
              link
              @click="handleToggleStatus(row)"
              :loading="statusLoadingMap.get(row.appId)"
            >
              {{ row.status === 1 ? '下线' : '上线' }}
            </el-button>
            <el-button
              type="primary"
              link
              @click="openTransferDialog(row)"
            >
              转移应用
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleCreateTicket(row)"
            >
              创建工单
            </el-button>
            <el-button
              type="primary"
              link
              :loading="repackLoadingMap.get(row.appId)"
              @click="handleRepack(row)"
            >
              重新提交打包
            </el-button>
            <el-button
              type="primary"
              link
              @click="handleShare(row)"
            >
              Share
            </el-button>
          </div>
        </template>
      </TableActionColumn>

          <el-table-column prop="appId" label="ID" width="80" />
          <el-table-column label="商品信息" min-width="320">
            <template #default="{ row }">
              <AppProductInfo :product="row" :thumb-size="56" />
            </template>
          </el-table-column>

      <el-table-column label="作者" width="80">
        <template #default="{ row }">
          {{ row.user?.username || '-' }}
        </template>
      </el-table-column>
      <!-- <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="0"
            @change="(val: number) => handleProductStatusChange(row, val)"
          />
        </template>
      </el-table-column> -->

      <el-table-column label="分类" width="220">
        <template #default="{ row }">
          <span style="display: flex; flex-wrap: wrap; align-items: center; gap: 4px;">
            <el-tag
              v-for="cat in row.categories"
              :key="cat.id"
              style="margin-right: 2px; margin-bottom: 2px;"
            >
              {{ cat.name }}
            </el-tag>
            <el-button
              size="small"
              type="primary"
              link
              :icon="Edit"
              @click="handleEditCategories(row)"
              style="margin-left: 4px; font-size: 16px;"
            />
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="download" label="下载量" width="80">
        <template #default="{ row }">
          {{ row.download }}
        </template>
      </el-table-column>
      <el-table-column prop="purchase" label="购买量" width="80">
        <template #default="{ row }">
          {{ row.purchase ?? '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="price" label="价格" width="80">
        <template #default="{ row }">
          ${{ row.price }}
        </template>
      </el-table-column>
      <el-table-column prop="trialLasts" label="试用时长" width="100">
        <template #default="{ row }">
          {{ row.trialLasts }}小时
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="120">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column prop="lastGoLive" label="上线时间" width="120">
        <template #default="{ row }">
          {{ formatProductGoLive(row.lastGoLive, formatDate) }}
        </template>
      </el-table-column>
        </el-table>
      </template>
      <template #mobile>
        <MobileRecordList :items="products" row-key="appId" :loading="loading" empty-text="暂无商品">
          <template #default="{ item: row }">
            <div class="product-mobile-card">
              <el-checkbox v-if="batchMode" :model-value="selectedProducts.some(item => item.appId === row.appId)" @change="toggleSelectedProduct(row)">选择此应用</el-checkbox>
              <AppProductInfo
                :app-id="row.appId"
                :title="row.name"
                :design-id="row.designId"
                :image-url="row.garminImageUrl || row.heroFile?.url || ''"
                :store-url="row.garminStoreUrl"
                :thumb-size="52"
              />
              <div class="mobile-field-grid product-mobile-fields">
                <div class="mobile-field">
                  <div class="mobile-field-label">ID</div>
                  <div class="mobile-field-value">{{ row.appId }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">作者</div>
                  <div class="mobile-field-value">{{ row.user?.username || '-' }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">下载 / 购买</div>
                  <div class="mobile-field-value">{{ row.download }} / {{ row.purchase ?? '-' }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">价格</div>
                  <div class="mobile-field-value">${{ row.price }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">试用时长</div>
                  <div class="mobile-field-value">{{ row.trialLasts }}小时</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">创建时间</div>
                  <div class="mobile-field-value">{{ row.createdAt ? formatDate(row.createdAt) : '-' }}</div>
                </div>
                <div class="mobile-field">
                  <div class="mobile-field-label">上线时间</div>
                  <div class="mobile-field-value">{{ formatProductGoLive(row.lastGoLive, formatDate) }}</div>
                </div>
              </div>
              <div class="product-mobile-categories">
                <el-tag v-for="cat in row.categories" :key="cat.id" size="small">{{ cat.name }}</el-tag>
                <el-button size="small" type="primary" link :icon="Edit" @click="handleEditCategories(row)">
                  分类
                </el-button>
              </div>
            </div>
          </template>
          <template #actions="{ item: row }">
            <template v-if="!batchMode">
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="openStore(row)">打开商店</el-button>
            <el-button type="primary" link :disabled="!row.garminStoreUrl" @click="copyToClipboard(row.garminStoreUrl)">复制链接</el-button>
            <el-button type="primary" link @click="copyAppMeta(row)">复制信息</el-button>
            <el-button type="primary" link @click="openPoints(row.appId)">积分兑换</el-button>
            <el-button type="primary" link :loading="syncing.get(row.appId) === 'index'" :disabled="syncing.has(row.appId)" @click="handleSync(row, 'index')">同步索引</el-button>
            <el-button type="primary" link :loading="syncing.get(row.appId) === 'cn'" :disabled="syncing.has(row.appId)" @click="handleSync(row, 'cn')">同步到国内数据库</el-button>
            <el-button
              size="small"
              :type="row.status === 1 ? 'danger' : 'success'"
              :loading="statusLoadingMap.get(row.appId)"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '下线' : '上线' }}
            </el-button>
            <el-button size="small" @click="openTransferDialog(row)">转移</el-button>
            <el-button size="small" @click="handleCreateTicket(row)">工单</el-button>
            <el-button size="small" :loading="repackLoadingMap.get(row.appId)" @click="handleRepack(row)">打包</el-button>
            <el-button size="small" @click="handleShare(row)">Share</el-button>
            </template>
          </template>
        </MobileRecordList>
      </template>
    </ResponsiveTableShell>
    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
    <el-dialog v-model="selectedBatchDialogVisible" title="操作选中应用" width="min(520px, 94vw)" :close-on-click-modal="false" :close-on-press-escape="!selectedBatchSubmitting" :show-close="!selectedBatchSubmitting">
      <el-alert :title="`仅修改勾选的 ${selectedProducts.length} 个应用`" type="info" :closable="false" />
      <el-form label-width="110px" :disabled="selectedBatchSubmitting" style="margin-top: 20px">
        <el-form-item label="操作">
          <el-select v-model="selectedBatchAction">
            <el-option label="修改试用时长" value="trial" />
            <el-option label="添加分类" value="add-category" />
            <el-option label="移除分类" value="remove-category" />
            <el-option label="重置权重为 20" value="weight" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="selectedBatchAction === 'trial'" label="新时长（小时）">
          <el-input-number v-model="selectedTrialLasts" :min="0" :precision="2" :step="0.25" />
        </el-form-item>
        <el-form-item v-if="selectedBatchAction.includes('category')" label="分类">
          <el-select v-model="selectedBatchCategoryId" filterable placeholder="请选择分类">
            <el-option v-for="cat in allCategories" :key="cat.id" :label="cat.name" :value="cat.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button :disabled="selectedBatchSubmitting" @click="selectedBatchDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="selectedBatchSubmitting" :disabled="!selectedProducts.length" @click="submitSelectedBatch">确认修改选中应用</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="trialDurationDialogVisible"
      title="批量修改试用时长"
      width="min(520px, 94vw)"
      :close-on-click-modal="false"
      :close-on-press-escape="!updatingTrialDuration"
      :show-close="!updatingTrialDuration"
    >
      <el-alert
        title="修改全部未删除应用中时长匹配的记录，包括未上线应用，不受当前筛选和分页限制。"
        type="warning"
        :closable="false"
        show-icon
      />
      <el-form label-width="110px" style="margin-top: 20px" :disabled="updatingTrialDuration">
        <el-form-item label="原时长（小时）" required>
          <el-input-number v-model="sourceTrialLasts" :min="0" :precision="2" :step="0.25" />
        </el-form-item>
        <el-form-item label="新时长（小时）" required>
          <el-input-number v-model="targetTrialLasts" :min="0" :precision="2" :step="0.25" />
        </el-form-item>
      </el-form>
      <p>例如：0.25 小时为 15 分钟。本操作修改应用试用配置，不直接改写用户试用记录。</p>
      <template #footer>
        <el-button :disabled="updatingTrialDuration" @click="trialDurationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="updatingTrialDuration" @click="handleBatchUpdateTrialDuration">批量修改</el-button>
      </template>
    </el-dialog>

    <!-- 创建工单对话框 -->
    <el-dialog
      v-model="ticketDialogVisible"
      title="创建工单"
      width="500px"
    >
      <el-form :model="ticketForm" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="ticketForm.title" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="ticketForm.priority" placeholder="选择优先级" style="width: 180px">
            <el-option label="Low" value="low" />
            <el-option label="Medium" value="medium" />
            <el-option label="High" value="high" />
            <el-option label="Urgent" value="urgent" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="ticketForm.description" type="textarea" rows="4" placeholder="请填写工单描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="ticketDialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="ticketSubmitting" @click="submitCreateTicket">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 转移应用对话框 -->
    <el-dialog
      v-model="transferDialogVisible"
      title="转移应用所属设计师"
      width="480px"
    >
      <div v-if="productForTransfer">
        <p style="margin-bottom: 8px;">
          当前应用：<strong>{{ productForTransfer.name }}</strong>（ID：{{ productForTransfer.appId }}）
        </p>
        <p style="margin-bottom: 16px;">
          当前作者：{{ (productForTransfer as any)?.user?.username || '-' }}
        </p>
      </div>
      <div>
        <span style="display: inline-block; margin-bottom: 8px;">选择新的设计师：</span>
        <UserSelect
          v-model="transferTargetUserId"
          :role-authorities="['ROLE_DESIGNER']"
          placeholder="搜索并选择新设计师"
          style="width: 100%;"
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="transferDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="transferLoading"
            @click="confirmTransferOwner"
          >
            确认转移
          </el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="编辑商品"
      width="min(900px, 94vw)"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="商品名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            placeholder="请输入商品描述"
          />
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="form.paymentMethod" @change="handlePaymentChange">
            <el-option label="免费" value="free" />
            <el-option label="WPay 支付" value="wpay" />
            <el-option label="Garmin 官方支付" value="garmin" />
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="price">
          <el-input-number
            v-model="form.price"
            :disabled="form.paymentMethod === 'free'"
            :precision="2"
            :step="0.1"
            :min="0"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="权重" prop="storeWeight">
          <el-input-number
            v-model="form.storeWeight"
            :precision="0"
            :step="1"
            :min="0"
            :max="99"
          />
        </el-form-item>
        <el-form-item label="试用（小时）" prop="trialLasts">
          <el-input-number
            v-model="form.trialLasts"
            :disabled="form.paymentMethod !== 'wpay'"
            :precision="2"
            :step="0.1"
            :min="0"
          />
        </el-form-item>
        <el-form-item label="上线时间" prop="lastGoLive">
          <el-date-picker v-model="form.lastGoLive" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss" :clearable="false" placeholder="选择上线时间" style="width: 100%" />
        </el-form-item>
        <el-form-item label="商品图片" prop="garminImageUrl">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-change="(file: any) => handleImageChange(file)"
            :before-upload="beforeUpload"
          >
            <img v-if="form.garminImageUrl" :src="form.garminImageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item label="商店链接" prop="garminStoreUrl">
          <el-input v-model="form.garminStoreUrl" placeholder="请输入商店链接" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="form.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
        <el-form-item label="分类">
          <el-select
            v-model="form.categories"
            multiple
            filterable
            placeholder="请选择分类"
            style="width: 100%"
            :clearable="true"
            value-key="id"
          >
            <el-option
              v-for="cat in allCategories"
              :key="cat.id"
              :label="cat.name"
              :value="cat"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="pointsDialogVisible" title="表盘积分兑换" width="min(560px, 94vw)" destroy-on-close>
      <AppPointsSettings v-if="pointsAppId && pointsDialogVisible" :app-id="pointsAppId" />
    </el-dialog>

    <!-- 分类编辑对话框 -->
    <el-dialog
      v-model="categoryDialogVisible"
      title="编辑产品分类"
      width="600px"
    >
      <div style="display: flex; gap: 20px;">
        <div style="flex: 1;">
          <el-checkbox-group v-model="selectedCategoryIds" style="display: flex; flex-direction: column;">
            <el-checkbox
              v-for="cat in allCategories"
              :key="cat.id"
              :label="cat.id"
              size="large"
            >
              {{ cat.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>
        <div style="flex-shrink: 0; width: 150px;">
          <el-image
            v-if="productForCategoryEdit?.garminImageUrl || productForCategoryEdit?.heroFile?.url"
            :src="productForCategoryEdit.garminImageUrl || productForCategoryEdit.heroFile?.url"
            style="width: 150px; height: 150px; border-radius: 8px;"
            fit="cover"
          />
          <div v-else style="width: 150px; height: 150px; background-color: #f5f7fa; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: #909399;">
            无图片
          </div>
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="categoryDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmCategoryUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 所有应用分类管理对话框 -->
    <el-dialog
      v-model="bulkCategoryDialogVisible"
      title="一键管理分类"
      width="520px"
    >
      <el-alert
        title="此操作作用于所有应用，与当前筛选和分页无关。"
        type="warning"
        :closable="false"
      />
      <el-select
        v-model="bulkCategorySelection"
        filterable
        placeholder="请选择分类"
        class="bulk-category-select"
      >
        <el-option
          v-for="cat in allCategories"
          :key="cat.id"
          :label="`${cat.name} (${cat.slug})`"
          :value="cat.id"
        />
      </el-select>
      <p v-if="selectedBulkCategory" class="bulk-category-hint">
        {{
          isWholeBulkCategory
            ? '将 whole 分类加入所有尚未关联的应用。'
            : `将“${selectedBulkCategory.name}”分类从所有应用中清空，其他分类不受影响。`
        }}
      </p>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bulkCategoryDialogVisible = false">取消</el-button>
          <el-button
            type="danger"
            :disabled="!selectedBulkCategory"
            :loading="bulkCategorySubmitting"
            @click="handleBulkCategoryManagement"
          >
            {{ bulkCategoryActionLabel }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- Social Media Share Dialog -->
    <el-dialog
      v-model="shareDialogVisible"
      title="Social Media Share"
      width="780px"
      destroy-on-close
    >
      <div v-if="shareProduct" class="share-dialog-content">
        <!-- Product Preview Card -->
        <div class="share-product-card">
          <el-image
            v-if="shareProduct.garminImageUrl || shareProduct.heroFile?.url"
            :src="shareProduct.garminImageUrl || shareProduct.heroFile?.url"
            style="width: 80px; height: 80px; border-radius: 12px; flex-shrink: 0;"
            fit="cover"
          />
          <div style="flex: 1; min-width: 0;">
            <div style="font-weight: 600; font-size: 16px; color: #1d1d1f;">{{ shareProduct.name }}</div>
            <div style="color: #86868b; font-size: 13px; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
              {{ shareProduct.description || 'No description' }}
            </div>
            <div style="margin-top: 6px; display: flex; gap: 8px; align-items: center;">
              <el-tag size="small" type="info">${{ shareProduct.price }}</el-tag>
              <el-tag size="small">{{ shareProduct.download ?? 0 }} downloads</el-tag>
            </div>
          </div>
        </div>

        <!-- Bound Share Assets -->
        <div class="share-section">
          <div class="bound-share-toolbar">
            <div>
              <div class="share-section-title">Bound Share Images</div>
              <div class="bound-share-hint">PNG, JPEG, or WebP · up to 10 MB each · maximum {{ MAX_SHARE_IMAGES }} per app</div>
            </div>
            <el-tag size="small" type="info">{{ boundShareImages.length }}/{{ MAX_SHARE_IMAGES }}</el-tag>
          </div>

          <el-upload
            v-model:file-list="shareImageFiles"
            multiple
            :auto-upload="false"
            :limit="MAX_SHARE_IMAGES"
            accept="image/png,image/jpeg,image/webp"
            :disabled="shareImagesUploading || boundShareImages.length >= MAX_SHARE_IMAGES"
            :on-exceed="handleShareImageExceed"
          >
            <el-button :disabled="shareImagesUploading || boundShareImages.length >= MAX_SHARE_IMAGES">
              Select Images
            </el-button>
          </el-upload>

          <el-button
            v-if="shareImageFiles.length"
            type="primary"
            :loading="shareImagesUploading"
            :disabled="boundShareImages.length + shareImageFiles.length > MAX_SHARE_IMAGES"
            class="bound-share-upload-button"
            @click="handleUploadShareImages"
          >
            Upload and Bind {{ shareImageFiles.length }}
          </el-button>

          <div v-loading="shareImagesLoading" class="bound-share-grid">
            <div v-for="image in boundShareImages" :key="image.id" class="bound-share-card">
              <el-image
                :src="getShareImageUrl(image)"
                fit="cover"
                class="bound-share-image"
                :preview-src-list="[getShareImageUrl(image)]"
                preview-teleported
              />
              <div class="bound-share-card-footer">
                <span :title="image.fileName || image.altText">{{ image.fileName || image.altText || `Image ${image.id}` }}</span>
                <el-button
                  type="danger"
                  link
                  :loading="shareImageDeletingId === image.id"
                  @click="handleDeleteShareImage(image)"
                >
                  Delete
                </el-button>
              </div>
            </div>
            <el-empty
              v-if="!shareImagesLoading && boundShareImages.length === 0"
              description="No bound share images"
              :image-size="56"
            />
          </div>
        </div>

        <!-- Platform Selection -->
        <div class="share-section">
          <div class="share-section-title">Select Platforms</div>
          <el-checkbox-group v-model="selectedPlatforms" class="share-platform-grid">
            <el-checkbox
              v-for="p in availablePlatforms"
              :key="p.value"
              :label="p.value"
              class="share-platform-checkbox"
            >
              <span class="share-platform-icon">{{ p.icon }}</span>
              <span>{{ p.label }}</span>
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- Optional Overrides -->
        <div class="share-section">
          <div class="share-section-title">Customize (Optional)</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <el-input v-model="shareOptions.title" placeholder="Custom title" clearable />
            <el-input v-model="shareOptions.subtitle" placeholder="Custom subtitle" clearable />
            <el-color-picker v-model="shareOptions.bgColor" show-alpha size="default" />
            <el-input v-model="shareOptions.brandLogo" placeholder="Brand logo URL (optional)" clearable />
          </div>
        </div>

        <!-- Generate Button -->
        <div style="text-align: center; margin: 20px 0 8px;">
          <el-button
            type="primary"
            size="large"
            :loading="shareGenerating"
            :disabled="selectedPlatforms.length === 0"
            @click="handleGenerateShareImages"
            style="min-width: 200px; border-radius: 10px;"
          >
            Generate Share Images
          </el-button>
        </div>

        <!-- Generated Results -->
        <div v-if="shareResult && shareResult.shareImages?.length" class="share-results">
          <div class="share-section-title">Generated Images</div>
          <div class="share-results-grid">
            <div
              v-for="img in shareResult.shareImages"
              :key="img.platform"
              class="share-result-card"
            >
              <div class="share-result-platform">{{ getPlatformLabel(img.platform) }}</div>
              <template v-if="img.imageUrl">
                <el-image
                  :src="img.imageUrl"
                  fit="cover"
                  class="share-result-image"
                  :preview-src-list="[img.imageUrl]"
                  preview-teleported
                />
                <div class="share-result-actions">
                  <el-button size="small" type="primary" link @click="copyToClipboard(img.imageUrl)">
                    Copy URL
                  </el-button>
                  <el-button size="small" type="primary" link @click="openInNewTab(img.imageUrl)">
                    Open
                  </el-button>
                </div>
              </template>
              <div v-else class="share-result-error">
                {{ img.error || 'Generation failed' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import TableActionColumn from '@/components/common/TableActionColumn.vue'
import AppSearchInput from '@/components/common/AppSearchInput.vue'
import { appSearchParams } from '@/utils/appSearch'
import AppPointsSettings from '@/components/AppPointsSettings.vue'
import { computed, reactive, ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules, UploadFiles, UploadRawFile, UploadUserFile } from 'element-plus'
import { Edit, Plus, Search, Refresh, TrendCharts, ArrowDown } from '@element-plus/icons-vue'
import AppProductInfo from '@/components/common/AppProductInfo.vue'
import MobileRecordList from '@/components/common/MobileRecordList.vue'
import ResponsiveTableShell from '@/components/common/ResponsiveTableShell.vue'
import { formatDate } from '@/utils/date'
import { formatProductGoLive } from './productDisplay.mjs'
import { rebuildOne } from '@/api/watchface-search'
import { submitCnCatalogProduct } from '@/api/app-management'
import { addProductCategory, deleteProductCategory, createProductPackageTask, fetchProductPage, updateProduct, updateProductCategories, toggleProductStatus, transferProductOwner, refreshProductStats, resetAllProductStoreWeights, batchUpdateProductTrialDuration, manageCategoryForAllProducts } from '@/api/products'
import { uploadProductHeroImage } from '@/api/files'
import { fetchAllCategories } from '@/api/category'
import type { Product } from '@/types/product'
import type { Category } from '@/types/category'
import { createTicket } from '@/api/ticket'
import { useUserStore } from '@/store/user'
import UserSelect from '@/components/users/UserSelect.vue'
import { generateShareImages } from '@/api/share'
import type { ShareProductVO } from '@/api/share'
import {
  deleteProductShareImage,
  fetchProductShareImages,
  uploadProductShareImages,
} from '@/api/product-share-images'
import type { ProductShareImageVO } from '@/api/product-share-images'

// 表格数据
const userStore = useUserStore()
const products = ref<Product[]>([])
const loading = ref(false)
const refreshingStats = ref(false)
const resettingStoreWeights = ref(false)
const trialDurationDialogVisible = ref(false)
const updatingTrialDuration = ref(false)
const sourceTrialLasts = ref<number>()
const targetTrialLasts = ref<number>()

const openTrialDurationDialog = () => {
  sourceTrialLasts.value = undefined
  targetTrialLasts.value = undefined
  trialDurationDialogVisible.value = true
}

const handleBatchUpdateTrialDuration = async () => {
  if (updatingTrialDuration.value) return
  const source = sourceTrialLasts.value
  const target = targetTrialLasts.value
  if (source == null || target == null || !Number.isFinite(source) || !Number.isFinite(target) || source < 0 || target < 0) {
    ElMessage.warning('请填写有效的非负试用时长（小时）')
    return
  }
  if (source === target) {
    ElMessage.warning('新试用时长不能与原时长相同')
    return
  }
  updatingTrialDuration.value = true
  try {
    try {
      await ElMessageBox.confirm(
        `将全部未删除应用中试用时长为 ${source} 小时的记录改为 ${target} 小时，不受当前筛选和分页限制。确认修改？`,
        '确认批量修改试用时长',
        { confirmButtonText: '确认修改', cancelButtonText: '取消', type: 'warning' }
      )
    } catch {
      return
    }
    const res = await batchUpdateProductTrialDuration({ sourceTrialLasts: source, targetTrialLasts: target })
    if (res.code === 0) {
      ElMessage.success(`已修改 ${res.data ?? 0} 个应用的试用时长`)
      trialDurationDialogVisible.value = false
      await fetchProducts()
    } else {
      ElMessage.error(res.msg || '批量修改试用时长失败')
    }
  } catch {
    ElMessage.error('批量修改试用时长失败')
  } finally {
    updatingTrialDuration.value = false
  }
}
const batchMode = ref(false)
const productTable = ref<{ clearSelection: () => void; toggleRowSelection: (row: Product, selected: boolean) => void }>()
const selectedProducts = ref<Product[]>([])
const selectedBatchDialogVisible = ref(false)
const selectedBatchSubmitting = ref(false)
const selectedBatchAction = ref('trial')
const selectedTrialLasts = ref<number>()
const selectedBatchCategoryId = ref<number>()

const toggleSelectedProduct = (row: Product) => {
  productTable.value?.toggleRowSelection(row, !selectedProducts.value.some(item => item.appId === row.appId))
}

const toggleBatchMode = () => {
  productTable.value?.clearSelection()
  selectedProducts.value = []
  batchMode.value = !batchMode.value
}

const submitSelectedBatch = async () => {
  if (selectedBatchSubmitting.value || !selectedProducts.value.length) return
  const action = selectedBatchAction.value
  const duration = selectedTrialLasts.value
  const categoryId = selectedBatchCategoryId.value
  if (action === 'trial' && (duration == null || !Number.isFinite(duration) || duration < 0)) {
    ElMessage.warning('请填写有效的非负试用时长（小时）')
    return
  }
  if (action.includes('category') && categoryId == null) {
    ElMessage.warning('请选择分类')
    return
  }
  const rows = [...selectedProducts.value]
  selectedBatchSubmitting.value = true
  let completed = 0
  try {
    for (const row of rows) {
      const response = action === 'add-category'
        ? await addProductCategory(row.appId, categoryId!)
        : action === 'remove-category'
          ? await deleteProductCategory(row.appId, categoryId!)
          : await updateProduct(row.appId, action === 'trial' ? { trialLasts: duration } : { storeWeight: 20 })
      if (response.code !== 0) throw new Error(response.msg || '请求失败')
      completed++
    }
    ElMessage.success(`已更新 ${completed} 个选中应用`)
  } catch (error) {
    ElMessage.error(`已完成 ${completed}/${rows.length} 个，应用 ${rows[completed]?.appId} 操作失败，已停止：${error instanceof Error ? error.message : '请求失败'}`)
  } finally {
    selectedBatchSubmitting.value = false
    selectedBatchDialogVisible.value = false
    await fetchProducts()
  }
}

const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const allCategories = ref<Category[]>([])

// 表单相关
const dialogVisible = ref(false)
const saving = ref(false)
const syncing = reactive(new Map<number, 'index' | 'cn'>())
const formRef = ref<FormInstance>()
const pointsDialogVisible = ref(false)
const pointsAppId = ref<number>()
const openPoints = (id: number) => { pointsAppId.value = id; pointsDialogVisible.value = true }

const form = ref({
  appId: 0,
  designId: '',
  paymentMethod: 'free',
  lastGoLive: '',
  name: '',
  description: '',
  price: 0,
  garminImageUrl: '',
  garminStoreUrl: '',
  garminAppUuid: '',
  trialLasts: 0,
  status: 1,
  download: 0,
  storeWeight: 20,
  categories: [] as Category[]
})

const rules: FormRules = {
  paymentMethod: [{ required: true, message: '请选择支付方式', trigger: 'change' }],
  trialLasts: [{ required: true, type: 'number', min: 0, message: '请输入非负试用时长', trigger: 'blur' }],
  name: [
    { required: true, message: '请输入商品名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入商品价格', trigger: 'blur' }
  ],
}

type TicketFormModel = {
  title: string
  description?: string
  priority?: string
  assigneeId?: number | null
  creatorId?: number | null
  dueDate?: string | null
  productId?: number | null
}

const ticketDialogVisible = ref(false)
const ticketSubmitting = ref(false)
const ticketForm = ref<TicketFormModel>({
  title: '',
  description: '',
  priority: 'medium',
  assigneeId: null,
  creatorId: null,
  dueDate: null,
  productId: null,
})

// 转移应用对话框
const transferDialogVisible = ref(false)
const transferLoading = ref(false)
const transferTargetUserId = ref<number | undefined>(undefined)
const productForTransfer = ref<Product | null>(null)

// 搜索和排序相关
const searchName = ref('')
const route = useRoute()
const recentOnline = route.query.online === 'last30'
const goLivePreset = ref(recentOnline ? 'last30' : '')
const sortOrder = ref(recentOnline ? 'last_go_live:desc' : 'created_at:desc')
const selectedCategoryId = ref<number | undefined>(undefined)
const selectedCreatorId = ref<number | undefined>(undefined)
const selectedStatus = ref<number | undefined>(recentOnline ? 1 : undefined)
const createdAtRange = ref<[string, string] | null>(null)
const createdAtPreset = ref('')

const createdAtPresetOptions = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '近7天', value: 'last7' },
  { label: '近30天', value: 'last30' },
  { label: '本月', value: 'thisMonth' },
  { label: '上月', value: 'lastMonth' },
]

const handleSearch = () => {
  currentPage.value = 1
  fetchProducts()
}
const handleSort = () => {
  currentPage.value = 1
  fetchProducts()
}

const handleFilterChange = () => {
  currentPage.value = 1
  fetchProducts()
}

const formatDateForQuery = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-')
}

const buildDateRange = (preset: string): [string, string] | null => {
  const now = new Date()
  const start = new Date(now)
  const end = new Date(now)

  if (preset === 'today') {
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'yesterday') {
    start.setDate(start.getDate() - 1)
    end.setDate(end.getDate() - 1)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'last7') {
    start.setDate(start.getDate() - 6)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'last30' || preset === 'last90') {
    start.setDate(start.getDate() - (preset === 'last90' ? 89 : 29))
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'thisMonth') {
    start.setDate(1)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  if (preset === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1)
    end.setDate(0)
    return [formatDateForQuery(start), formatDateForQuery(end)]
  }
  return null
}

const createdAtShortcuts = createdAtPresetOptions.map(option => ({
  text: option.label,
  value: () => {
    const range = buildDateRange(option.value)
    if (!range) return []
    return range.map(date => new Date(`${date}T00:00:00`))
  }
}))

const handleCreatedAtPresetChange = (preset: string) => {
  createdAtRange.value = preset ? buildDateRange(preset) : null
  handleFilterChange()
}

const handleCreatedAtRangeChange = () => {
  createdAtPreset.value = ''
  handleFilterChange()
}

const handleGoLiveChange = () => {
  if (goLivePreset.value) {
    selectedStatus.value = 1
    sortOrder.value = 'last_go_live:desc'
  }
  handleFilterChange()
}

const handleRecentOnlineDownloads = () => {
  createdAtPreset.value = ''
  createdAtRange.value = null
  goLivePreset.value = 'last30'
  selectedStatus.value = 1
  sortOrder.value = 'download:desc'
  handleFilterChange()
}

// 手动刷新产品下载/购买统计
const handleRefreshStats = async () => {
  try {
    refreshingStats.value = true
    const res = await refreshProductStats()
    if (res.code === 0 && res.data) {
      ElMessage.success('已触发统计刷新')
      // 刷新当前列表数据
      fetchProducts()
    } else {
      ElMessage.error(res.msg || '刷新统计失败')
    }
  } catch (error) {
    ElMessage.error('刷新统计失败')
  } finally {
    refreshingStats.value = false
  }
}

const handleResetAllStoreWeights = async () => {
  try {
    await ElMessageBox.confirm(
      '将所有未删除应用中不为 20 的权重重置为 20。该操作影响全部应用，不受当前筛选和分页限制，是否继续？',
      '重置所有应用权重',
      {
        confirmButtonText: '确认重置',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return
  }

  resettingStoreWeights.value = true
  try {
    const res = await resetAllProductStoreWeights()
    if (res.code === 0) {
      ElMessage.success(`已重置 ${res.data ?? 0} 个应用权重`)
      await fetchProducts()
    } else {
      ElMessage.error(res.msg || '重置应用权重失败')
    }
  } catch {
    ElMessage.error('重置应用权重失败')
  } finally {
    resettingStoreWeights.value = false
  }
}

// 获取商品列表
const fetchProducts = async () => {
  const goLiveRange = buildDateRange(goLivePreset.value)
  productTable.value?.clearSelection()
  selectedProducts.value = []
  loading.value = true
  try {
    const res = await fetchProductPage({
      pageNum: currentPage.value,
      pageSize: pageSize.value,
      orderBy: sortOrder.value,
      ...appSearchParams(searchName.value),
      populate: 'user,categories,payment',
      categoryId: selectedCategoryId.value || undefined,
      userId: selectedCreatorId.value || undefined,
      status: selectedStatus.value,
      lastGoLiveStart: goLiveRange ? `${goLiveRange[0]} 00:00:00` : undefined,
      lastGoLiveEnd: goLiveRange ? `${goLiveRange[1]} 23:59:59` : undefined,
      createdAtStart: createdAtRange.value?.[0] ? `${createdAtRange.value[0]} 00:00:00` : undefined,
      createdAtEnd: createdAtRange.value?.[1] ? `${createdAtRange.value[1]} 23:59:59` : undefined,
    })
    if (res.code === 0) {
      products.value = res.data?.list || []
      total.value = res.data?.total || 0
    } else {
      ElMessage.error(res.msg || '获取商品列表失败')
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const openStore = (row: Product) => {
  if (row.garminStoreUrl) window.open(row.garminStoreUrl, '_blank', 'noopener,noreferrer')
}

const copyAppMeta = (row: Product) => copyToClipboard([
  `Name: ${row.name || '-'}`,
  `App ID: ${row.appId}`,
  `Design ID: ${row.designId || '-'}`,
  `Last go live: ${row.lastGoLive || '-'}`,
  `Store URL: ${row.garminStoreUrl || '-'}`,
].join('\n'))

const handleCreateTicket = async (row: Product) => {
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }

  const assigneeId = (row as any)?.user?.id ?? userStore.userInfo.id

  ticketForm.value = {
    title: `针对作品的支持工单 - ${row.name}`,
    description: `针对作品（appId: ${row.appId}）创建支持工单。`,
    priority: 'medium',
    assigneeId,
    creatorId: userStore.userInfo.id,
    dueDate: null,
    productId: row.appId,
  }

  ticketDialogVisible.value = true
}

// 打开转移应用对话框
const openTransferDialog = (row: Product) => {
  productForTransfer.value = row
  // 默认不选中；如果你希望默认选当前作者，可以改成 row.user?.id
  transferTargetUserId.value = undefined
  transferDialogVisible.value = true
}

const submitCreateTicket = async () => {
  if (!userStore.userInfo?.id) {
    ElMessage.error('未获取到当前登录用户信息')
    return
  }

  try {
    ticketSubmitting.value = true
    const payload = {
      title: ticketForm.value.title,
      description: ticketForm.value.description,
      priority: ticketForm.value.priority,
      assigneeId: ticketForm.value.assigneeId ?? userStore.userInfo.id,
      creatorId: userStore.userInfo.id,
      dueDate: ticketForm.value.dueDate,
      productId: ticketForm.value.productId ?? null,
    }

    const res = await createTicket(payload as any)
    if (res.code === 0) {
      ElMessage.success('工单已创建')
      ticketDialogVisible.value = false
    } else {
      ElMessage.error(res.msg || '创建工单失败')
    }
  } catch (error) {
    ElMessage.error('创建工单失败')
  } finally {
    ticketSubmitting.value = false
  }
}

// 确认转移应用所属用户
const confirmTransferOwner = async () => {
  if (!productForTransfer.value) {
    ElMessage.error('未选择要转移的应用')
    return
  }
  if (!transferTargetUserId.value) {
    ElMessage.error('请选择新的设计师')
    return
  }

  try {
    transferLoading.value = true
    const res = await transferProductOwner(productForTransfer.value.appId, transferTargetUserId.value)
    if (res.code === 0) {
      ElMessage.success('应用所属用户已转移')
      transferDialogVisible.value = false
      // 重置状态
      productForTransfer.value = null
      transferTargetUserId.value = undefined
      // 刷新列表
      fetchProducts()
    } else {
      ElMessage.error(res.msg || '转移应用失败')
    }
  } catch (error) {
    ElMessage.error('转移应用失败')
  } finally {
    transferLoading.value = false
  }
}

// 获取所有分类
const fetchCategories = async () => {
  const res = await fetchAllCategories()
  if (res.code === 0 && res.data) {
    allCategories.value = res.data
  }
}


// 新增商品（已移除）

// 编辑商品
const handleEdit = (row: Product) => {
  form.value = { ...row, paymentMethod: row.payment?.paymentMethod || 'free', lastGoLive: row.lastGoLive || '', price: row.price ?? row.payment?.price ?? 0, storeWeight: row.storeWeight ?? 20, categories: row.categories || [] } as any
  handlePaymentChange()
  dialogVisible.value = true
}

// 上传图片相关
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isImage) {
    ElMessage.error('只能上传图片文件！')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB！')
    return false
  }
  return true
}

async function handleImageChange(file: any) {
  if (!file || !file.raw) return;
  loading.value = true;
  const res = await uploadProductHeroImage(file.raw)
  if (res.code === 0 && res.data) {
    form.value.garminImageUrl = res.data as string
    ElMessage.success('图片上传成功');
  } else {
    ElMessage.error(res.msg || '图片上传失败');
  }
  loading.value = false;
}

// 提交表单
const handlePaymentChange = () => {
  if (form.value.paymentMethod === 'free') form.value.price = 0
  if (form.value.paymentMethod !== 'wpay') form.value.trialLasts = 0
}

const handleSync = async (row: Product, target: 'index' | 'cn') => {
  if (syncing.has(row.appId)) return
  syncing.set(row.appId, target)
  try {
    const res = target === 'index' ? await rebuildOne(row.appId) : await submitCnCatalogProduct(row.appId)
    if (res.code !== 0 || res.data !== true) throw new Error(res.msg || '同步请求失败')
    ElMessage.success(target === 'index' ? '索引同步请求已处理' : '已提交，后台同步中')
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '同步失败，请重试')
  } finally {
    syncing.delete(row.appId)
  }
}

const handleSubmit = async () => {
  if (!formRef.value || saving.value) return
  if (!await formRef.value.validate().catch(() => false)) return
  if (form.value.paymentMethod !== 'free' && form.value.price < 1.99) {
    ElMessage.error('付费应用金额不能低于 1.99')
    return
  }
  saving.value = true
  try {
    const res = await updateProduct(form.value.appId, {
      name: form.value.name,
      description: form.value.description,
      paymentMethod: form.value.paymentMethod,
      price: form.value.price,
      lastGoLive: form.value.lastGoLive || undefined,
      storeWeight: form.value.storeWeight,
      garminImageUrl: form.value.garminImageUrl,
      garminStoreUrl: form.value.garminStoreUrl,
      trialLasts: form.value.trialLasts,
    })
    if (res.code !== 0) throw new Error(res.msg || '更新失败')
    const categories = await updateProductCategories(form.value.appId, (form.value.categories || []).map(c => c.id))
    if (categories.code !== 0) throw new Error(categories.msg || '商品已保存，但分类更新失败，请重试')
    ElMessage.success('更新成功')
    dialogVisible.value = false
    await fetchProducts()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : '更新失败')
  } finally {
    saving.value = false
  }
}

// 分页相关
const handleSizeChange = (val: number) => {
  pageSize.value = val
  fetchProducts()
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
  fetchProducts()
}

// 状态切换加载状态映射
const statusLoadingMap = ref<Map<number, boolean>>(new Map())
const repackLoadingMap = ref<Map<number, boolean>>(new Map())

const setRepackLoading = (appId: number, loading: boolean) => {
  const next = new Map(repackLoadingMap.value)
  next.set(appId, loading)
  repackLoadingMap.value = next
}

const handleRepack = async (row: Product) => {
  if (!row.designId) {
    ElMessage.error('该应用缺少 designId，无法重新提交打包')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确认重新提交「${row.name || row.appId}」的 IQ 打包任务？`,
      '重新提交打包',
      {
        confirmButtonText: '重新提交',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
  } catch {
    return
  }

  setRepackLoading(row.appId, true)
  try {
    const res = await createProductPackageTask(row.designId)
    if (res.code === 0) {
      ElMessage.success('已重新提交打包任务')
    } else {
      ElMessage.error(res.msg || '重新提交失败')
    }
  } catch (error) {
    ElMessage.error('重新提交失败')
  } finally {
    setRepackLoading(row.appId, false)
  }
}

// 分类编辑弹窗
const categoryDialogVisible = ref(false)
const productForCategoryEdit = ref<Product | null>(null)
const selectedCategoryIds = ref<number[]>([])
const bulkCategoryDialogVisible = ref(false)
const bulkCategorySelection = ref<number | undefined>(undefined)
const bulkCategorySubmitting = ref(false)
const selectedBulkCategory = computed(() =>
  allCategories.value.find(category => category.id === bulkCategorySelection.value)
)
const isWholeBulkCategory = computed(() => selectedBulkCategory.value?.slug === 'whole')
const bulkCategoryActionLabel = computed(() =>
  isWholeBulkCategory.value ? '加入所有应用' : '清空该分类'
)

// 分类增删逻辑 - 改为弹窗批量修改
const handleEditCategories = (row: Product) => {
  productForCategoryEdit.value = row;
  selectedCategoryIds.value = (row.categories || []).map((c: Category) => c.id);
  categoryDialogVisible.value = true;
}

const handleConfirmCategoryUpdate = async () => {
  if (!productForCategoryEdit.value) return;

  try {
    const res = await updateProductCategories(productForCategoryEdit.value.appId, selectedCategoryIds.value);
    if (res.code === 0) {
      ElMessage.success('分类更新成功');
      categoryDialogVisible.value = false;
      fetchProducts(); // Refresh the table
    } else {
      ElMessage.error(res.msg || '更新失败');
    }
  } catch (error) {
    ElMessage.error('更新失败');
  }
}

const handleBulkCategoryManagement = async () => {
  const category = selectedBulkCategory.value
  if (!category) return

  const description = category.slug === 'whole'
    ? '确认将 whole 分类加入所有应用吗？'
    : `确认从所有应用中清空“${category.name}”分类吗？其他分类不会改变。`
  try {
    await ElMessageBox.confirm(description, '确认一键管理分类', {
      type: 'warning',
      confirmButtonText: bulkCategoryActionLabel.value,
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    bulkCategorySubmitting.value = true
    const response = await manageCategoryForAllProducts(category.id)
    if (response.code !== 0) {
      ElMessage.error(response.msg || '分类批量操作失败')
      return
    }
    ElMessage.success(`${bulkCategoryActionLabel.value}完成，影响 ${response.data ?? 0} 个应用`)
    bulkCategoryDialogVisible.value = false
    bulkCategorySelection.value = undefined
    await fetchProducts()
  } catch {
    ElMessage.error('分类批量操作失败')
  } finally {
    bulkCategorySubmitting.value = false
  }
}

// 切换产品上架/下架状态
const handleToggleStatus = async (row: Product) => {
  try {
    // 设置加载状态
    statusLoadingMap.value.set(row.appId, true)

    const newStatus = row.status === 1 ? 0 : 1
    const response = await toggleProductStatus(row.appId, newStatus)

    if (response.code === 0) {
      // 更新本地状态
      row.status = newStatus
      ElMessage.success(newStatus === 1 ? '产品已上线' : '产品已下线')
    } else {
      ElMessage.error(response.msg || '状态切换失败')
    }
  } catch (error) {
    console.error('切换产品状态失败:', error)
    ElMessage.error('状态切换失败')
  } finally {
    // 清除加载状态
    statusLoadingMap.value.set(row.appId, false)
  }
}

// ========== Social Media Share ==========
const shareDialogVisible = ref(false)
const shareGenerating = ref(false)
const shareProduct = ref<Product | null>(null)
const shareResult = ref<ShareProductVO | null>(null)
const boundShareImages = ref<ProductShareImageVO[]>([])
const shareImageFiles = ref<UploadUserFile[]>([])
const shareImagesLoading = ref(false)
const shareImagesUploading = ref(false)
const shareImageDeletingId = ref<number | null>(null)
const MAX_SHARE_IMAGES = 8
const selectedPlatforms = ref<string[]>(['facebook', 'instagram', 'x', 'pinterest'])
const shareOptions = ref({
  title: '',
  subtitle: '',
  bgColor: '',
  brandLogo: '',
})

const availablePlatforms = [
  { value: 'facebook', label: 'Facebook', icon: 'f' },
  { value: 'instagram', label: 'Instagram', icon: 'ig' },
  { value: 'x', label: 'X (Twitter)', icon: 'X' },
  { value: 'pinterest', label: 'Pinterest', icon: 'P' },
  { value: 'linkedin', label: 'LinkedIn', icon: 'in' },
  { value: 'tiktok', label: 'TikTok', icon: 'Tk' },
  { value: 'xhs', label: 'Xiaohongshu', icon: 'XH' },
  { value: 'youtube', label: 'YouTube', icon: 'YT' },
]

const getPlatformLabel = (value: string) => {
  return availablePlatforms.find(p => p.value === value)?.label || value
}

const handleShare = (row: Product) => {
  shareProduct.value = row
  shareResult.value = null
  boundShareImages.value = []
  shareImageFiles.value = []
  shareOptions.value = { title: '', subtitle: '', bgColor: '', brandLogo: '' }
  selectedPlatforms.value = ['facebook', 'instagram', 'x', 'pinterest']
  shareDialogVisible.value = true
  void loadBoundShareImages(row.appId)
}

const loadBoundShareImages = async (appId: number) => {
  try {
    shareImagesLoading.value = true
    const res = await fetchProductShareImages(appId)
    boundShareImages.value = res.data || []
  } catch {
    boundShareImages.value = []
  } finally {
    shareImagesLoading.value = false
  }
}

const getShareImageUrl = (image: ProductShareImageVO) => {
  return image.imageUrl || image.image?.url || ''
}

const handleShareImageExceed = (_files: File[], currentFiles: UploadFiles) => {
  const remaining = Math.max(0, MAX_SHARE_IMAGES - boundShareImages.value.length)
  ElMessage.warning(`This app can bind ${remaining} more share image${remaining === 1 ? '' : 's'}`)
  shareImageFiles.value = currentFiles.slice(0, remaining)
}

const handleUploadShareImages = async () => {
  if (!shareProduct.value) return
  const files = shareImageFiles.value
    .map((file) => file.raw)
    .filter((file): file is UploadRawFile => Boolean(file))
  if (!files.length) {
    ElMessage.warning('Select at least one image')
    return
  }
  if (boundShareImages.value.length + files.length > MAX_SHARE_IMAGES) {
    ElMessage.warning(`Each app can bind at most ${MAX_SHARE_IMAGES} share images`)
    return
  }

  try {
    shareImagesUploading.value = true
    const res = await uploadProductShareImages(shareProduct.value.appId, files)
    boundShareImages.value = res.data || []
    shareImageFiles.value = []
    ElMessage.success('Share images uploaded and bound')
  } finally {
    shareImagesUploading.value = false
  }
}

const handleDeleteShareImage = async (image: ProductShareImageVO) => {
  if (!shareProduct.value) return
  try {
    await ElMessageBox.confirm(
      'Delete this bound share image? Existing product images will not be affected.',
      'Delete Share Image',
      { type: 'warning', confirmButtonText: 'Delete' },
    )
  } catch {
    return
  }

  try {
    shareImageDeletingId.value = image.id
    await deleteProductShareImage(shareProduct.value.appId, image.id)
    await loadBoundShareImages(shareProduct.value.appId)
    ElMessage.success('Share image deleted')
  } finally {
    shareImageDeletingId.value = null
  }
}

const handleGenerateShareImages = async () => {
  if (!shareProduct.value) return
  try {
    shareGenerating.value = true
    shareResult.value = null
    const res = await generateShareImages({
      appId: shareProduct.value.appId,
      platforms: selectedPlatforms.value,
      title: shareOptions.value.title || undefined,
      subtitle: shareOptions.value.subtitle || undefined,
      bgColor: shareOptions.value.bgColor || undefined,
      brandLogo: shareOptions.value.brandLogo || undefined,
    })
    if (res.code === 0 && res.data) {
      shareResult.value = res.data
      ElMessage.success('Share images generated')
    } else {
      ElMessage.error(res.msg || 'Failed to generate share images')
    }
  } catch (error) {
    ElMessage.error('Failed to generate share images')
  } finally {
    shareGenerating.value = false
  }
}

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('Copied to clipboard')
  } catch {
    ElMessage.error('Failed to copy')
  }
}

const openInNewTab = (url: string) => {
  window.open(url, '_blank')
}

onMounted(() => {
  fetchProducts()
  fetchCategories()
})
</script>

<style scoped>
.products-container {
  padding: 20px;
}

/* Keep filters aligned independently from the operational actions. */
.product-search-panel {
  margin-bottom: 20px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
}

.product-filter-bar {
  box-sizing: border-box;
  display: grid;
  gap: 12px;
  padding: 14px 16px;
}

.filter-primary-row {
  display: grid;
  grid-template-columns: minmax(220px, 320px) repeat(3, minmax(120px, 170px)) auto;
  justify-content: start;
  align-items: end;
  gap: 10px;
}

.filter-secondary-row {
  display: grid;
  grid-template-columns: minmax(120px, 160px) minmax(120px, 160px) minmax(240px, 300px) minmax(150px, 180px);
  align-items: end;
  gap: 10px;
}

.filter-field {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.filter-label {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}

.product-search-panel .filter-field > :not(.filter-label) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.product-search-panel :deep(.el-input__wrapper),
.product-search-panel :deep(.el-select__wrapper) {
  min-height: 32px;
  box-sizing: border-box;
  border-radius: 6px;
}

.filter-search-button {
  height: 32px;
  padding-inline: 18px;
}

.product-actions-bar {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px 20px;
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-light);
}

.product-actions-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.product-actions-group .el-button + .el-button {
  margin-left: 0;
}

.more-actions-icon {
  margin-left: 8px;
}

.reset-weights-action {
  color: var(--el-color-warning-dark-2);
}

@media (max-width: 1200px) {
  .filter-primary-row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .filter-keyword {
    grid-column: span 2;
  }

  .filter-secondary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .product-filter-bar {
    padding: 16px;
    gap: 14px;
  }

  .filter-primary-row,
  .filter-secondary-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .filter-keyword,
  .filter-range-field,
  .filter-search-button {
    grid-column: 1 / -1;
  }

  .filter-range-field {
    grid-row: 2;
  }

  .product-actions-bar {
    padding: 12px 16px;
  }
}

.bulk-category-select {
  width: 100%;
  margin-top: 16px;
}

.bulk-category-hint {
  margin: 14px 0 0;
  color: #606266;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .products-container {
    padding: 0;
  }

  .product-mobile-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .product-mobile-fields {
    padding-top: 4px;
  }

  .product-mobile-categories {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .share-product-card {
    align-items: flex-start;
  }

  .share-platform-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.avatar-uploader {
  :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);

    &:hover {
      border-color: var(--el-color-primary);
    }
  }
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}

.avatar {
  width: 100px;
  height: 100px;
  display: block;
  object-fit: cover;
}

.product-info {
  display: flex;
  align-items: center;
  gap: 12px;
}
.product-thumb {
  width: 56px;
  height: 56px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  flex: 0 0 56px;
}
.product-meta { min-width: 0; }
.product-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}
.product-name a { color: #409EFF; text-decoration: none; }
.product-name a:hover { text-decoration: underline; }
.product-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #666;
}
.product-details span {
  background: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

/* ========== Social Media Share Dialog (Apple Design) ========== */
.share-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.share-product-card {
  display: flex;
  gap: 16px;
  align-items: center;
  padding: 16px;
  background: #f5f5f7;
  border-radius: 14px;
}

.share-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.share-section-title {
  font-size: 13px;
  font-weight: 600;
  color: #86868b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bound-share-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.bound-share-hint {
  margin-top: 4px;
  color: #86868b;
  font-size: 12px;
}

.bound-share-upload-button {
  margin-top: 10px;
}

.bound-share-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  min-height: 84px;
  margin-top: 12px;
}

.bound-share-card {
  overflow: hidden;
  border: 1px solid #ebeef5;
  border-radius: 10px;
  background: #fff;
}

.bound-share-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
}

.bound-share-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 8px;
  font-size: 12px;
}

.bound-share-card-footer span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-platform-grid {
  display: grid !important;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.share-platform-checkbox {
  margin: 0 !important;
  padding: 10px 12px;
  border: 1.5px solid #e5e5ea;
  border-radius: 10px;
  transition: all 0.2s ease;
  background: #fff;
}

.share-platform-checkbox:hover {
  border-color: #007aff;
  background: #f0f5ff;
}

.share-platform-checkbox.is-checked {
  border-color: #007aff;
  background: #e8f0fe;
}

.share-platform-icon {
  display: inline-block;
  width: 22px;
  height: 22px;
  line-height: 22px;
  text-align: center;
  font-weight: 700;
  font-size: 11px;
  color: #fff;
  background: #1d1d1f;
  border-radius: 6px;
  margin-right: 6px;
  vertical-align: middle;
}

.share-results {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.share-result-card {
  border: 1px solid #e5e5ea;
  border-radius: 12px;
  overflow: hidden;
  background: #fff;
  transition: box-shadow 0.2s ease;
}

.share-result-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.share-result-platform {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1f;
  background: #f5f5f7;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.share-result-image {
  width: 100%;
  height: 140px;
  display: block;
}

.share-result-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 8px;
  border-top: 1px solid #f0f0f0;
}

.share-result-error {
  padding: 16px 12px;
  font-size: 12px;
  color: #ff3b30;
  text-align: center;
}
</style>
