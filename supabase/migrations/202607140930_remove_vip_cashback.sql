begin;

update public.vip_levels
set
  cashback_rate = 0,
  multi_player_cashback_rate = 0,
  multi_player_min_count = 0,
  reward_note = regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          reward_note,
          '｜三陪以上該次消費2%回饋',
          '',
          'g'
        ),
        '｜三陪以上該次消費3%回饋',
        '',
        'g'
      ),
      '｜每筆消費回饋3%',
      '',
      'g'
    ),
    '｜單次點三個陪陪及以上可獲得該次消費10%返點回饋',
    '',
    'g'
  )
where guild_id in ('1501098191813214312', '1206138511535898654');

commit;
