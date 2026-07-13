begin;

update public.vip_levels
set
  reward_coupon = nullif(
    btrim(
      regexp_replace(
        replace(
          replace(
            replace(
              replace(reward_coupon, '陪玩心動值禮物加成雙倍券', '心動值禮物雙倍券'),
              '陪玩心動值禮物加成雙倍',
              '心動值禮物雙倍券'
            ),
            '前綴',
            '後綴'
          ),
          '冠名',
          '後綴'
        ),
        '(^|,)[^,]*禮品卡[^,]*',
        '',
        'g'
      ),
      ','
    ),
    ''
  ),
  reward_note = replace(replace(reward_note, '前綴', '後綴'), '冠名', '後綴')
where guild_id in ('1501098191813214312', '1206138511535898654');

update public.user_items
set
  item_name = case
    when item_name like '%心動值%' and item_name like '%雙倍%'
      then '心動值禮物雙倍券'
    else replace(replace(item_name, '前綴', '後綴'), '冠名', '後綴')
  end,
  item_type = 'coupon'
where item_name not like '%禮品卡%'
  and (
    item_name like '%折券%'
    or item_name like '%折價券%'
    or item_name like '%優惠券%'
    or (item_name like '%後綴%' and item_name like '%券%')
    or (item_name like '%前綴%' and item_name like '%券%')
    or (item_name like '%冠名%' and item_name like '%券%')
    or (item_name like '%心動值%' and item_name like '%雙倍%')
  );

commit;
